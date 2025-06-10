import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔗 Connecting to Supabase...');
    console.log(`URL: ${supabaseUrl}`);
    
    // Test connection by fetching from a simple table or using auth
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
    } else {
      console.log('✅ Successfully connected to Supabase!');
      console.log('Session data:', data);
      
      // Test database connection by listing tables (if available)
      try {
        const { data: tables, error: dbError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .limit(5);
          
        if (dbError) {
          console.log('⚠️  Database query test failed:', dbError.message);
        } else {
          console.log('📊 Database accessible. Sample tables:', tables);
        }
      } catch (dbErr) {
        console.log('⚠️  Could not test database access (normal for RLS)');
      }
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

testConnection();