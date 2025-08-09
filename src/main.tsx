import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
  Link,
  useRouterState,
} from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import './styles/globals.css'
import Logo from './components/Logo'
import HomeComponent from './routes/Home'
import ExploreComponent from './routes/Explore'
import MatchComponent from './routes/Match'
import CareComponent from './routes/Care'
import AboutComponent from './routes/About'


function Shell() {
  const { location } = useRouterState()

  const NavLink = ({ to, label }: { to: string; label: string }) => (
    <Link
      to={to}
      className={`px-3 hover:text-charcoal transition-colors ${
        location.pathname === to
          ? 'underline decoration-taupe underline-offset-8'
          : 'text-softtext'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 backdrop-blur bg-ivory/80 border-b border-black/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <span className="font-heading text-lg tracking-wide">Furora</span>
          </div>
          <nav>
            <NavLink to="/" label="Home" />
            <NavLink to="/explore" label="Explore" />
            <NavLink to="/match" label="Match" />
            <NavLink to="/care" label="Care" />
            <NavLink to="/about" label="About" />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.25 } }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.18 } }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-black/5 text-center py-6 text-softtext text-sm">
        © {new Date().getFullYear()} Furora
      </footer>
    </div>
  )
}

const rootRoute = createRootRoute({ component: Shell })

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomeComponent,
})
const exploreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/explore',
  component: ExploreComponent,
})
const matchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/match',
  component: MatchComponent,
})
const careRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/care',
  component: CareComponent,
})
const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: AboutComponent,
})

const routeTree = rootRoute.addChildren([
  homeRoute,
  exploreRoute,
  matchRoute,
  careRoute,
  aboutRoute,
])

const router = createRouter({ routeTree })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
