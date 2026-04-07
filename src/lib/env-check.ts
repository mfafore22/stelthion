export function validateProductionEnv(){
    if (process.env.NODE_ENV !== 'production') return;

    if(!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32){
         throw new Error('AUTH_SECRET must be a 32+ character random string');
    }

    if (!process.env.DATABASE_URL?.includes('sslmode')) {
    console.warn('WARNING: DATABASE_URL should include sslmode=require');
    }

   
    if (!process.env.RESEND_API_KEY) {
    console.warn('WARNING: RESEND_API_KEY not set — OTP emails will only log to console');
   }
   
}
