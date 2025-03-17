import Link from "next/link"
import { Github, Twitter, DiscIcon as Discord } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-secondary/90 py-4 px-6 text-white">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="flex space-x-6 mb-4 md:mb-0">
          <Link href="/terms" className="text-sm hover:text-primary transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="text-sm hover:text-primary transition-colors">
            Privacy
          </Link>
          <Link href="/docs" className="text-sm hover:text-primary transition-colors">
            Docs
          </Link>
          <Link href="/faqs" className="text-sm hover:text-primary transition-colors">
            FAQs
          </Link>
        </div>

        <div className="flex space-x-4">
          <Link href="https://twitter.com" target="_blank" className="hover:text-primary transition-colors">
            <Twitter size={20} />
            <span className="sr-only">Twitter</span>
          </Link>
          <Link href="https://github.com" target="_blank" className="hover:text-primary transition-colors">
            <Github size={20} />
            <span className="sr-only">GitHub</span>
          </Link>
          <Link href="https://discord.com" target="_blank" className="hover:text-primary transition-colors">
            <Discord size={20} />
            <span className="sr-only">Discord</span>
          </Link>
        </div>
      </div>
    </footer>
  )
}

