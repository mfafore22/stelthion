import '@testing-library/jest-dom'
import dotenv from 'dotenv'

// Load both env files
dotenv.config({ path: '.env' })
dotenv.config({ path: '.env.local' })