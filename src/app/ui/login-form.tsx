'use client';

import { useActionState } from "react";
import { authenticate } from "../lib/action";
import { useSearchParams } from "next/navigation";
import { User, Lock, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export default function LoginForm() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
    const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-gray-100 px-10 py-10">
                
                {/* Brand */}
                <div className="flex justify-center mb-8">
                    <Image
                        src="/stelthion-brandmark.png"
                        alt="Stelthion"
                        width={440}
                        height={120}
                        className="object-contain"
                        priority
                    />
                </div>

                {/* Subtitle */}
                <p className="text-center text-sm text-gray-500 mb-8 font-medium">
                    Property Manager Secure Login
                </p>

                {/* Form */}
                <form action={formAction} className="space-y-5">
                    <div>
                        <label htmlFor="email" className="flex items-center gap-1.5 text-sm text-gray-600 mb-1.5">
                            <User size={14} className="text-gray-400" />
                            User ID
                        </label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            placeholder="Enter your user ID"
                            required
                            disabled={isPending}
                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="flex items-center gap-1.5 text-sm text-gray-600 mb-1.5">
                            <Lock size={14} className="text-gray-400" />
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            placeholder="Enter your password"
                            required
                            disabled={isPending}
                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all disabled:opacity-50"
                        />
                    </div>

                    {errorMessage && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                            <AlertCircle size={14} />
                            {errorMessage}
                        </div>
                    )}

                    <input type="hidden" name="redirectTo" value={callbackUrl} />

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Authenticating...
                            </span>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-400 mt-8">
                    Secure access for authorized personnel only
                </p>
            </div>
        </div>
    );
}