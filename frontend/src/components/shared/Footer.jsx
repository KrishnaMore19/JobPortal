import React from 'react';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

function Footer() {
  return (
    <footer className="relative z-10 bg-gradient-to-tr from-[#5D4E9E] via-[#6A38C2] to-[#4A71C9] text-white py-10 px-6 shadow-inner">
      {/* Social Media Icons */}
      <div className="flex justify-center gap-6 mb-6">
        <a
          href="https://facebook.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:scale-110 transition-transform"
        >
          <FaFacebook className="text-white/90 text-2xl hover:text-[#4267B2]" />
        </a>
        <a
          href="https://twitter.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:scale-110 transition-transform"
        >
          <FaTwitter className="text-white/90 text-2xl hover:text-[#1DA1F2]" />
        </a>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:scale-110 transition-transform"
        >
          <FaInstagram className="text-white/90 text-2xl hover:text-[#E1306C]" />
        </a>
        <a
          href="https://linkedin.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:scale-110 transition-transform"
        >
          <FaLinkedin className="text-white/90 text-2xl hover:text-[#0A66C2]" />
        </a>
      </div>

      {/* Gradient Divider */}
      <div className="w-1/3 mx-auto h-px bg-gradient-to-r from-white/20 via-white/40 to-white/20 opacity-50 mb-6" />

      {/* Text Info */}
      <div className="text-center space-y-2">
        <p className="text-sm text-white/80">
          &copy; {new Date().getFullYear()} <span className="font-semibold text-white">JobForge</span>. All rights reserved.
        </p>
        <p className="text-xs text-white/50">
          Developed by{' '}
          <a
            href="https://portfolio1-eight-woad.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:underline font-medium"
          >
            Krishna More
          </a>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
