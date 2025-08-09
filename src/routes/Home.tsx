import React from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'

type CardProps = {
  iconSrc: string
  iconAlt: string
  title: string
  desc: string
  to?: string
}

function Card({ iconSrc, iconAlt, title, desc, to }: CardProps) {
  // Per-card image styling
  const imgClass = iconSrc.includes('explore.jpeg')
    ? 'w-full h-56 object-contain bg-white rounded-t-lg p-2 scale-110 translate-y-2' // Explore shifted down
    : iconSrc.includes('care.jpeg')
    ? 'w-full h-56 object-cover object-top bg-white rounded-t-lg' // Care hides gray edge
    : 'w-full h-56 object-contain bg-white rounded-t-lg p-4' // Match

  const content = (
    <>
      <img src={iconSrc} alt={iconAlt} className={imgClass} loading="lazy" decoding="async" />
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="font-heading text-xl mb-2">{title}</h3>
        <p className="text-softtext flex-1">{desc}</p>
      </div>
    </>
  )

  return (
    <motion.div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col" whileHover={{ scale: 1.02 }}>
      {to ? (
        <Link to={to} className="flex flex-col h-full">
          {content}
        </Link>
      ) : (
        content
      )}
    </motion.div>
  )
}

export default function HomeComponent() {
  return (
    <section className="hero-bg max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="font-heading text-4xl md:text-5xl">Your pet world, beautifully connected.</h1>
        <p className="text-softtext max-w-2xl mx-auto">
          Explore pet-friendly places, find your perfect match, and keep care simple — all in a calm, minimal interface.
        </p>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <Card
          title="Explore"
          desc="Discover parks, cafés, and trails near you."
          to="/explore"
          iconSrc="/icons/explore.jpeg"
          iconAlt="Explore icon"
        />
        <Card
          title="Match"
          desc="Short quiz → adoptable pet matches."
          to="/match"
          iconSrc="/icons/match.jpeg"
          iconAlt="Match icon"
        />
        <Card
          title="Care"
          desc="Routines, calendar, and expenses."
          to="/care"
          iconSrc="/icons/care.jpeg"
          iconAlt="Care icon"
        />
      </div>
    </section>
  )
}
