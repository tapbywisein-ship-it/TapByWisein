import React from 'react';
import { Link } from 'react-router-dom';
import Arrow from './Arrow';
import TbwHeading from './TbwHeading';

export default function Hero() {
  return (
    <section className="hero-redesign" aria-labelledby="wordmark">
      <div className="hero-top-group">
        <TbwHeading />
        <p className="hero-sub">THE ONE TAP THAT CONNECTS PEOPLE.</p>
        
        <div className="hero-actions">
          <Link className="cta" to="/tapbywisein/product">
            EXPLORE TAPWISEIN
            <Arrow />
          </Link>
        </div>
      </div>

      <div className="hero-video-container">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline 
          src="/walk.mp4" 
        />
      </div>
    </section>
  );
}