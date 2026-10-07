import React, { useEffect, useState } from 'react';
import BlurText from './BlurText';
import StickerPeel from './StickerPeel';
import TextType from './TextType';

export function SplashScreen({ onComplete }) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Show splash for 2 seconds, then fade out
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2000);

    // Call onComplete after fade out animation (0.8s)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#0F172A',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: isFadingOut ? 0 : 1,
      transition: 'opacity 0.8s ease-in-out',
    }}>
      <div style={{ marginBottom: '1.5rem', marginTop: '-4rem' }}>
        <img 
          src="/logo.jpg" 
          alt="AutoStock AI Logo" 
          style={{ 
            width: '200px', 
            height: '200px', 
            borderRadius: '32px', 
            objectFit: 'cover',
            boxShadow: '0 0 50px rgba(59, 130, 246, 0.5)'
          }} 
        />
      </div>
      <div style={{ height: '220px', display: 'flex', alignItems: 'center' }}>
        <BlurText
          text="AUTOSTOCK AI"
          delay={100}
          animateBy="letters"
          direction="bottom"
          className="font-bold"
          style={{ fontSize: '12rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.02em', lineHeight: 1 }}
        />
      </div>
      
      <div style={{ 
        marginTop: '3rem', 
        fontSize: '0.9rem', 
        color: '#818cf8',
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        minHeight: '20px'
      }}>
        <TextType 
          text="Supply Chain Engine"
          typingSpeed={50}
          showCursor={true}
          cursorCharacter="|"
          loop={false}
        />
      </div>
    </div>
  );
}
