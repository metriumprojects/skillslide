import React from 'react'
import { Link } from 'react-router-dom'
import { FaDiscord } from "react-icons/fa6";

export default function Footer() {
  return (
    <footer className='bg-[#F5F5F5] min-h-[56px] sm:h-[60px] w-full px-6 sm:px-10 lg:px-[60px] py-4 sm:py-0 flex justify-between items-center max-sm:text-center max-sm:flex-col max-sm:gap-3.5 max-sm:py-5 mb-14 sm:mb-0 md:mb-0'>
      <div>
        <a href="mailto:help@skillslide.com" className='text-[#000000] hover:underline text-[13px] sm:text-[14px] font-normal leading-none'>
          help@skillslide.com
        </a>
      </div>
      <div className="flex flex-wrap gap-4 sm:gap-6 lg:gap-[24px] items-center max-sm:flex-col max-sm:items-center">
        <Link className='text-[#000000] hover:underline text-[13px] sm:text-[14px] font-normal leading-none' to="/privacy-policy">Privacy Policy</Link>
        <Link className='text-[#000000] hover:underline text-[13px] sm:text-[14px] font-normal leading-none' to="/terms-of-service">Terms Of Service (CGU)</Link>
        <Link className='text-[#000000] hover:underline text-[13px] sm:text-[14px] font-normal leading-none' to="/cookie-policy">Cookie Policy</Link>
        <Link className='text-[#000000] hover:underline text-[13px] sm:text-[14px] font-normal leading-none' to="/legal-notice">Legal Notice</Link>
        <a href='https://discord.gg/vpFwMVf9' target="_blank" rel="noreferrer" className='flex gap-2 items-center h-[34px] sm:h-[36px] rounded-lg px-3.5 sm:px-4 bg-[#728ADA] hover:bg-[#5e77cc] text-[#FFFFFF] text-[13px] sm:text-[14px] font-normal leading-none max-sm:justify-center transition-colors'>
          <FaDiscord className="text-base" /> Join Our Discord
        </a>
      </div>
    </footer>
  )
}
