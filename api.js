// api.js - Supabase-based User Registration API
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase configuration
const supabaseUrl = "https://wpcefsajlymoqrjmpumy.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwY2Vmc2FqbHltb3Fyam1wdW15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODAxMTUsImV4cCI6MjA3NzI1NjExNX0.oAIC9BF7L5PR1gbjkUC7R7GEgG1uBiQwMcXAokmdjKQ";
const supabase = createClient(supabaseUrl, supabaseKey);

// User registration endpoint
app.get('/register', async (req, res) => {
    try {
        const { user_id, username } = req.query;
        
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id is required'
            });
        }

        const userId = parseInt(user_id);
        const userUsername = username || `user_${userId}`;

        console.log(`🔄 Registering user: ${userId}, ${userUsername}`);

        // Check if user already exists in our tracking table
        const { data: existingUser, error: checkError } = await supabase
            .from('ton_bot_registrations')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking user:', checkError);
        }

        let result;
        if (existingUser) {
            // User already registered
            result = {
                success: true,
                message: 'User already registered',
                user_id: userId,
                username: userUsername,
                registered_at: existingUser.registered_at,
                total_registered: await getTotalRegistrations()
            };
        } else {
            // Register new user
            const { data, error } = await supabase
                .from('ton_bot_registrations')
                .insert([
                    {
                        user_id: userId,
                        username: userUsername,
                        registered_at: new Date().toISOString(),
                        status: 'active'
                    }
                ])
                .select()
                .single();

            if (error) {
                console.error('Error registering user:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to register user',
                    error: error.message
                });
            }

            result = {
                success: true,
                message: 'User registered successfully',
                user_id: userId,
                username: userUsername,
                registered_at: data.registered_at,
                total_registered: await getTotalRegistrations()
            };
        }

        console.log(`✅ Registration result:`, result);
        res.json(result);

    } catch (error) {
        console.error('❌ Server error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get registration stats
app.get('/stats', async (req, res) => {
    try {
        const total = await getTotalRegistrations();
        
        res.json({
            success: true,
            total_registered: total,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting statistics'
        });
    }
});

// Get all registrations (admin endpoint)
app.get('/registrations', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('ton_bot_registrations')
            .select('*')
            .order('registered_at', { ascending: false });

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            count: data.length,
            registrations: data
        });
    } catch (error) {
        console.error('Error getting registrations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching registrations'
        });
    }
});

// Helper function to get total registrations
async function getTotalRegistrations() {
    try {
        const { count, error } = await supabase
            .from('ton_bot_registrations')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Error counting registrations:', error);
        return 0;
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 TON Bot API running on port ${PORT}`);
    console.log(`📊 Supabase URL: ${supabaseUrl}`);
});

module.exports = app;
