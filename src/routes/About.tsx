import React from 'react'

export default function AboutComponent() {
  return (
    <section className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-heading text-4xl mb-4">About Furora</h1>
      <p className="text-softtext mb-8">
        Furora is a calm, minimal, all-in-one pet app. Explore pet-friendly places, match with adoptable pets,
        and keep daily care organized, with a warm, aesthetic UI.
      </p>

      <div className="card p-6 space-y-4">
        <h2 className="font-heading text-2xl">Hi, I’m Sruthi Yeruva</h2>
        <p className="text-softtext">
          I built Furora to combine my love for animals with thoughtful UI/UX. The focus is on serenity, accessibility,
          and tiny moments of delight, no chaos, just clarity.
        </p>
        <ul className="list-disc pl-5 text-softtext">
          <li>Explore: pet-friendly parks, cafés, and trails</li>
          <li>Match: short personality quiz → adoptable pet matches</li>
          <li>Care: routines, calendar, and expenses</li>
        </ul>
        <p className="text-softtext">
          Tech: React + TypeScript, Tailwind, Framer Motion, TanStack Router. Maps via Leaflet (and an API layer),
          charts & calendar for Care.
        </p>
        <p className="text-softtext">
          Find the project on GitHub and feel free to reach out, feedback is welcome!
        </p>

        {/* LinkedIn Button */}
        <div className="pt-4">
          <a
            href="https://www.linkedin.com/in/sruthi-yeruva/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-full shadow-md transition-all duration-300 hover:shadow-lg"
          >
            {/* LinkedIn Icon (SVG) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M20.452 20.452h-3.554v-5.569c0-1.328-.027-3.039-1.852-3.039-1.853 0-2.137 1.445-2.137 2.939v5.669H9.354V9h3.414v1.561h.049c.476-.9 1.637-1.852 3.372-1.852 3.605 0 4.271 2.373 4.271 5.457v6.286zM5.337 7.433a2.062 2.062 0 110-4.124 2.062 2.062 0 010 4.124zm1.777 13.019H3.561V9h3.553v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.225.792 24 1.771 24h20.451C23.207 24 24 23.225 24 22.271V1.729C24 .774 23.207 0 22.225 0z" />
            </svg>
            <span>Connect on LinkedIn</span>
          </a>
        </div>
      </div>
    </section>
  )
}
