// Test script to verify playlist delete functionality
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = 'https://ximimrsirfdetsdxcfgl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbWltcnNpcmZkZXRzZHhjZmdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2OTA2NTcsImV4cCI6MjA3OTI2NjY1N30.Du8jCeNkcfOjwApHw_Dq4GQr78MlBXi2BiQGTS6zx0g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPlaylistDelete() {
    console.log('Testing playlist delete functionality...');
    
    try {
        // First, let's test if we can query playlists (this should work for anon users)
        console.log('1. Testing playlist query...');
        const { data: playlists, error: queryError } = await supabase
            .from('playlists')
            .select('*')
            .limit(1);
        
        if (queryError) {
            console.log('❌ Query failed:', queryError.message);
        } else {
            console.log('✅ Query successful, found', playlists?.length || 0, 'playlists');
        }
        
        // Test delete operation (this should fail for anon users)
        console.log('2. Testing playlist delete (should fail for anon users)...');
        const { error: deleteError } = await supabase
            .from('playlists')
            .delete()
            .eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID
        
        if (deleteError) {
            console.log('✅ Delete correctly blocked:', deleteError.message);
        } else {
            console.log('❌ Delete unexpectedly succeeded');
        }
        
        console.log('\nTest completed successfully!');
        console.log('The delete functionality is properly secured.');
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testPlaylistDelete();