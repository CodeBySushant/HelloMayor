"use client";

import React from "react";

export function MayorCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#003893]/10 mb-16 overflow-hidden">
      <div className="flex flex-row items-stretch h-[400px]">
        {/* LEFT: Image */}
        <div className="w-[28%] h-full p-3">
          <div className="relative w-full h-full rounded-xl overflow-hidden shadow-md">
            {/* Image */}
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Balendra_Shah%2C_official_portrait.jpg/250px-Balendra_Shah%2C_official_portrait.jpg"
              alt="Mayor"
              className="w-full h-full object-cover"
            />

            {/* Gradient overlay (appeal) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
          </div>
        </div>

        {/* RIGHT: Content */}
        <div className="w-[72%] p-5 flex flex-col">
          <h3 className="text-xl md:text-2xl font-serif text-[#1f2937] font-semibold leading-tight">
            Mr. Ran Bahadur Rai
          </h3>

          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Former Mayor, Suryodaya Municipality, Ilam, Nepal
          </p>

          <div className="mt-4 space-y-2">
            <a className="text-sm md:text-base font-semibold text-[#003893] hover:underline block">
              Biography
            </a>
            <a className="text-sm md:text-base font-semibold text-[#003893] hover:underline block">
              About Suryodaya Municipality
            </a>
          </div>

          <blockquote className="mt-4 pl-4 border-l-4 border-[#003893]/40 text-sm md:text-base italic text-gray-700 leading-snug line-clamp-3">
            "Together, we can create a brighter future for Suryodaya
            Municipality by fostering unity, innovation, and sustainability..."
          </blockquote>
        </div>
      </div>
    </div>
  );
}
