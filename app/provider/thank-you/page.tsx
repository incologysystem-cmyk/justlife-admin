"use client";

import Link from "next/link";
import Image from "next/image";

export default function ProviderThankYouPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-10 text-gray-800">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-md border border-gray-200 p-10 text-center space-y-6">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg
              className="h-12 w-12 text-emerald-600"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-2xl font-bold text-gray-800">
          Application Submitted Successfully
        </h1>

        {/* Message */}
        <p className="text-sm text-gray-600 leading-relaxed">
          Thank you for submitting your provider registration application.
          Our team will review your details and get back to you shortly.
          You will receive updates on your registered email or phone number.
        </p>

        {/* Extra Message */}
        <div className="text-sm text-gray-700 bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
          <strong>Status:</strong> Under Review  
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/provider/login"
            className="w-full sm:w-auto px-6 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium shadow hover:bg-emerald-700 transition"
          >
            Go to Provider Login
          </Link>
        </div>

      </div>
    </div>
  );
}
