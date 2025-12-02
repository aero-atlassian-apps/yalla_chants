// Test to verify RLS is actually working by testing with authenticated user
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ximimrsirfdetsdxcfgl.supabase.co';

// Test with both anon and service role keys
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbWltcnNpcmZkZXRzZHhjZmdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2OTA2NTcsImV4cCI6MjA3OTI2NjY1N30.Du8jCeNkcfOjwApHw_Dq4GQr78MlBXi2BiQGTS6zx0g';

const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbWltcnNpcmZkZXRzZHhjZmdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY5MDY1NywiZXhwIjoyMDc5MjY2NjU3fQ.xxErdToUBePemIY3XIA3PQ0Syh0rpEI6Y1N7-wgQRJQ';

async function testRLSWithDifferentRoles() {
    console.log('Testing RLS with different authentication roles...\n');
    
    // Test with anon key (should be blocked)
    console.log('=== Testing with ANON key (should be blocked) ===');
    const anonClient = createClient(supabaseUrl, anonKey);
    
    try {
        const { error } = await anonClient
            .from('playlists')
            .delete()
            .eq('id', '00000000-0000-0000-0000-000000000000');
        
        if (error) {
            console.log('✅ ANON delete correctly blocked:', error.message);
        } else {
            console.log('❌ ANON delete unexpectedly succeeded - MAJOR SECURITY ISSUE!');
        }
    } catch (e) {
        console.log('✅ ANON delete blocked with exception:', e.message);
    }
    
    // Test with service role key (should succeed)
    console.log('\n=== Testing with SERVICE ROLE key (should succeed) ===');
    const serviceClient = createClient(supabaseUrl, serviceKey);
    
    try {
        const { error } = await serviceClient
            .from('playlists')
            .delete()
            .eq('id', '00000000-0000-0000-0000-000000000000');
        
        if (error) {
            console.log('Service role delete result:', error.message);
        } else {
            console.log('✅ Service role delete succeeded (as expected)');
        }
    } catch (e) {
        console.log('Service role delete exception:', e.message);
    }
    
    // Test query operations
    console.log('\n=== Testing query operations ===');
    
    try {
        const { data, error } = await anonClient
            .from('playlists')
            .select('*')
            .limit(1);
        
        if (error) {
            console.log('Query failed:', error.message);
        } else {
            console.log('✅ Query successful, found', data?.length || 0, 'playlists');
        }
    } catch (e) {
        console.log('Query exception:', e.message);
    }
    
    console.log('\n=== Summary ===');
    console.log('If ANON users can delete playlists, this is a CRITICAL security vulnerability!');
    console.log('The RLS policies are not being enforced properly.');
}

testRLSWithDifferentRoles();