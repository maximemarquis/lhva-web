import { TopBar } from '@/components/layout/TopBar'
import { Nav } from '@/components/layout/Nav'
import { Ticker } from '@/components/layout/Ticker'
import { Footer } from '@/components/layout/Footer'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <Nav />
      <Ticker />
      <main>{children}</main>
      <Footer />
    </>
  )
}