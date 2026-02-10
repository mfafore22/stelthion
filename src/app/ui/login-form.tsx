'use client';

import { Button } from "./button";
import { useActionState } from "react";
import { authenticate } from "../lib/action";

export default function LoginForm() {
    const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);

    return (
        <form action={formAction}>
            <h1>Please log in to continue</h1>
            
            <div>
                <label htmlFor="email">
                    Email
                </label>
                <div>
                    <input 
                        type="email" 
                        name="email" 
                        id="email"
                        required 
                        className="border p-2 rounded w-full"
                        disabled={isPending}
                    />
                </div>
            </div>

            <div>
                <label htmlFor="password">
                    Password
                </label>
                <div>
                    <input 
                        type="password" 
                        name="password" 
                        id="password"
                        required 
                        className="border p-2 rounded w-full"
                        disabled={isPending}
                    />
                </div>
            </div>

            {errorMessage && (
                <div className="text-red-500 text-sm mt-2">
                    {errorMessage}
                </div>
            )}

            <Button type="submit" disabled={isPending}>
                {isPending ? 'Logging in...' : 'Log in'}
            </Button>
        </form>
    );
}