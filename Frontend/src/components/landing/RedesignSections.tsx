import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Arrow from './Arrow';
import { useEvents } from '@/hooks/useEvents';
import { format } from 'date-fns';

/* =========================================================
   1. HOW IT WORKS (4-Row Horizontal Story)
   ========================================================= */
export function StoryAndProcessSection() {
  const [activeStep, setActiveStep] = useState(0);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let loop: NodeJS.Timeout;
    let isAutoPlaying = true;
    
    // Automatic timer-based flow
    const runFlow = (startStep = 0) => {
      if (!isAutoPlaying) return;
      setActiveStep(startStep);
      if (startStep === 0) {
        timeout = setTimeout(() => { if(isAutoPlaying) setActiveStep(1); 
          timeout = setTimeout(() => { if(isAutoPlaying) setActiveStep(2); 
            timeout = setTimeout(() => { if(isAutoPlaying) setActiveStep(3); 
              timeout = setTimeout(() => { if(isAutoPlaying) setActiveStep(4); }, 3000);
            }, 3000);
          }, 3000);
        }, 3000);
      }
    };

    runFlow();
    loop = setInterval(() => runFlow(0), 14000);

    // Scroll-based intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(index)) {
              // Once they scroll to a specific item, take over from auto-play
              isAutoPlaying = false;
              clearTimeout(timeout);
              clearInterval(loop);
              setActiveStep(index);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: "-35% 0px -35% 0px", // 30% center strip of viewport
        threshold: 0
      }
    );

    rowRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      isAutoPlaying = false;
      clearInterval(loop);
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, []);

  return (
    <section className="how-it-works-section">
      <div className="hiw-container">
        
        <div className="hiw-header">
          <div className="section-subtitle">HOW IT WORKS</div>
          <h2 className="hiw-main-title">The physical-to-digital bridge.</h2>
        </div>

        <div className="hiw-rows">
          
          {/* ==========================================
              ROW 01: MEET
              ========================================== */}
          <div 
            className={`hiw-row ${activeStep === 0 ? 'is-active' : ''} ${activeStep > 0 ? 'is-past' : ''}`}
            data-index="0"
            ref={(el) => (rowRefs.current[0] = el)}
          >
            
            {/* LEFT: VISUAL ACTION */}
            <div className="hiw-visual">
              <div className="hiw-meet-stage">
                <div className="meet-card mc-left">
                  <div className="mc-av">B</div>
                  <div className="mc-info">
                    <div className="mc-name">Bhuvana</div>
                    <div className="mc-role">Product Designer</div>
                  </div>
                </div>
                <div className="meet-card mc-right">
                  <div className="mc-av av-dark">S</div>
                  <div className="mc-info">
                    <div className="mc-name">Shivaji</div>
                    <div className="mc-role">Software Engineer</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* RIGHT: MEANING */}
            <div className="hiw-text">
              <div className="hiw-num">01</div>
              <div className="hiw-content">
                <h3 className="hiw-title">MEET</h3>
                <p className="hiw-desc">Meet someone at an event or professional environment.</p>
              </div>
            </div>

            {/* Connector to next */}
            <div className="hiw-connector"><div className="hiw-conn-dot"></div></div>
          </div>

          {/* ==========================================
              ROW 02: TAP
              ========================================== */}
          <div 
            className={`hiw-row ${activeStep === 1 ? 'is-active' : ''} ${activeStep > 1 ? 'is-past' : ''}`}
            data-index="1"
            ref={(el) => (rowRefs.current[1] = el)}
          >
            
            {/* LEFT: VISUAL ACTION */}
            <div className="hiw-visual">
              <div className="hiw-tap-stage">
                <div className="tap-card-device">
                  <div className="tcd-logo">TapByWisein</div>
                  <div className="tcd-mark">T</div>
                </div>
                <div className="tap-phone-mock">
                  <div className="tpm-notch"></div>
                  <div className="tpm-screen"></div>
                </div>
                <div className="tap-ripple"></div>
              </div>
            </div>
            
            {/* RIGHT: MEANING */}
            <div className="hiw-text">
              <div className="hiw-num">02</div>
              <div className="hiw-content">
                <h3 className="hiw-title">TAP</h3>
                <p className="hiw-desc">Tap your TapByWisein card or device against a smartphone.</p>
              </div>
            </div>

            {/* Connector to next */}
            <div className="hiw-connector"><div className="hiw-conn-dot"></div></div>
          </div>

          {/* ==========================================
              ROW 03: CONNECT
              ========================================== */}
          <div 
            className={`hiw-row ${activeStep === 2 ? 'is-active' : ''} ${activeStep > 2 ? 'is-past' : ''}`}
            data-index="2"
            ref={(el) => (rowRefs.current[2] = el)}
          >
            
            {/* LEFT: VISUAL ACTION */}
            <div className="hiw-visual">
              <div className="hiw-connect-stage">
                <div className="conn-phone">
                  <div className="cp-notch"></div>
                  <div className="cp-ui">
                    <div className="cp-av">B</div>
                    <div className="cp-name">Bhuvana</div>
                    <div className="cp-role">Product Designer</div>
                    <div className="cp-btn">SAVE CONTACT</div>
                  </div>
                </div>
                <div className="conn-line-area">
                  <div className="conn-node">Bhuvana</div>
                  <div className="conn-bridge">
                     <div className="conn-pulse"></div>
                  </div>
                  <div className="conn-node">Shivaji</div>
                </div>
              </div>
            </div>
            
            {/* RIGHT: MEANING */}
            <div className="hiw-text">
              <div className="hiw-num">03</div>
              <div className="hiw-content">
                <h3 className="hiw-title">CONNECT</h3>
                <p className="hiw-desc">Your professional information is exchanged instantly.</p>
              </div>
            </div>

            {/* Connector to next */}
            <div className="hiw-connector"><div className="hiw-conn-dot"></div></div>
          </div>

          {/* ==========================================
              ROW 04: CONTINUE
              ========================================== */}
          <div 
            className={`hiw-row ${activeStep === 3 ? 'is-active' : ''} ${activeStep > 3 ? 'is-past' : ''}`}
            data-index="3"
            ref={(el) => (rowRefs.current[3] = el)}
          >
            
            {/* LEFT: VISUAL ACTION */}
            <div className="hiw-visual">
              <div className="hiw-continue-stage">
                <div className="cont-flow">
                  <div className="cont-box">Profile</div>
                  <div className="cont-arrow">→</div>
                  <div className="cont-box">Connection</div>
                  <div className="cont-arrow">→</div>
                  <div className="cont-wisein">
                    <div className="cw-header">WiseIN Network</div>
                    <div className="cw-feed">
                      <div className="cw-post">
                         <div className="cw-av">B</div>
                         <div className="cw-lines">
                           <div className="cw-l"></div>
                           <div className="cw-l short"></div>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* RIGHT: MEANING */}
            <div className="hiw-text">
              <div className="hiw-num">04</div>
              <div className="hiw-content">
                <h3 className="hiw-title">CONTINUE</h3>
                <p className="hiw-desc">The connection continues digitally through WiseIN.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* =========================================================
   2. FAST PRODUCT DEMONSTRATION (Real Phone UI)
   ========================================================= */
export function ProductDemoSection() {
  const [demoState, setDemoState] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const runAnimationSequence = () => {
      setDemoState(0); // 2s: idle
      timeout = setTimeout(() => {
        setDemoState(1); // 2s: tap detected
        timeout = setTimeout(() => {
          setDemoState(2); // 2s: profile appears
          timeout = setTimeout(() => {
            setDemoState(3); // 2s: connection created
            timeout = setTimeout(() => {
              setDemoState(4); // 2s: continue on wisein
              timeout = setTimeout(() => {
                setDemoState(5); // 2s: hold
              }, 2000);
            }, 2000);
          }, 2000);
        }, 2000);
      }, 2000);
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        runAnimationSequence();
        const loop = setInterval(runAnimationSequence, 12000);
        return () => clearInterval(loop);
      }
    }, { threshold: 0.5 });
    
    if (containerRef.current) observer.observe(containerRef.current);
    
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <section className="product-demo-section">
      <div className="pds-container" ref={containerRef}>
        
        <div className="pds-text">
          <div className="section-subtitle">FROM TAP TO CONNECTION</div>
          <h2 className="pds-heading">Watch the magic happen.</h2>
          <p className="pds-desc">No app downloads required. A single tap bridges the gap between a physical introduction and a lasting digital connection.</p>
        </div>

        <div className="pds-visual">
          <div className="realistic-phone">
            {/* Phone Hardware Details */}
            <div className="rp-notch">
              <div className="rp-speaker"></div>
              <div className="rp-camera"></div>
            </div>
            <div className="rp-status-bar">
              <span>9:41</span>
              <div className="rp-icons">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
              </div>
            </div>

            {/* Phone Screen UI */}
            <div className="rp-screen">
              
              {/* State 0: Idle */}
              <div className={`rp-state rp-idle ${demoState === 0 ? 'is-active' : ''}`}>
                <div className="rp-idle-content">
                  <div className="rp-idle-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  </div>
                  <div>READY TO TAP</div>
                </div>
              </div>

              {/* State 1: Tap Detected */}
              <div className={`rp-state rp-tap-detected ${demoState === 1 ? 'is-active' : ''}`}>
                <div className="rp-nfc-modal">
                  <div className="rp-pulse-ring"></div>
                  <div className="rp-nfc-title">Tap Detected</div>
                  <div className="rp-nfc-sub">Connecting...</div>
                </div>
              </div>

              {/* State 2, 3, 4, 5: Profile UI */}
              <div className={`rp-state rp-profile-ui ${demoState >= 2 ? 'is-active' : ''}`}>
                <div className="rpp-top-bar">TapByWisein</div>
                <div className="rpp-header">
                  <div className="rpp-avatar">JD</div>
                </div>
                <div className="rpp-body">
                  <div className="rpp-name">John Doe</div>
                  <div className="rpp-role">Software Engineer</div>
                  <div className="rpp-location">Hyderabad, India</div>
                  
                  {/* Action Area */}
                  <div className="rpp-action-area">
                    {demoState === 2 && (
                      <div className="rpp-btn">Connect</div>
                    )}
                    {demoState === 3 && (
                      <div className="rpp-btn rpp-btn-success">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Connected
                      </div>
                    )}
                    {(demoState === 4 || demoState === 5) && (
                      <div className="rpp-btn rpp-btn-continue">
                        Continue on WiseIN
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

/* =========================================================
   3. BYWISEIN (Real Events)
   ========================================================= */
export function ByWiseinSection() {
  const { data, isLoading, error } = useEvents({ limit: 1 });
  const event = data?.events?.[0];

  return (
    <section className="bywisein-real-section">
      <div className="bwr-container">
        <div className="bwr-content">
          <div className="section-subtitle">BYWISEIN</div>
          <h2 className="bwr-title">Discover events. Meet people.</h2>
          <p className="bwr-desc">ByWisein brings the professional community together. Discover industry events, experience professional gatherings, and find your next opportunity.</p>
          <Link className="cta" to="/discover">
            EXPLORE BYWISEIN
            <Arrow />
          </Link>
        </div>
        
        <div className="bwr-visual">
          <div className="bwr-event-card">
            {isLoading && <div className="bwr-state-message">Loading upcoming events...</div>}
            {error && <div className="bwr-state-message">Unable to load events at this time.</div>}
            {!isLoading && !error && !event && <div className="bwr-state-message">No upcoming events found. Check back later!</div>}
            
            {!isLoading && !error && event && (
              <>
                <div className="bwr-card-image" style={{ backgroundImage: event.coverImage ? `url(${event.coverImage})` : 'linear-gradient(135deg, #1e293b, #334155)' }}>
                  <div className="bwr-card-tag">{event.locationType || 'Event'}</div>
                </div>
                <div className="bwr-card-body">
                  <h3 className="bwr-card-title">{event.title}</h3>
                  <div className="bwr-card-meta">
                    <span className="bwr-meta-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      {format(new Date(event.startDate), "EEE, MMM d")}
                    </span>
                    {event.city && (
                      <span className="bwr-meta-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        {event.city}
                      </span>
                    )}
                  </div>
                  
                  <div className="bwr-card-footer">
                    <div className="bwr-organizer">
                      {event.organizer?.profile?.avatar ? (
                         <img src={event.organizer.profile.avatar} alt="Organizer" className="bwr-org-av" />
                      ) : (
                         <div className="bwr-org-av">{event.organizer?.username?.charAt(0) || 'O'}</div>
                      )}
                      <span className="bwr-org-name">By {event.organizer?.profile?.company || event.organizer?.username || 'Organizer'}</span>
                    </div>
                    <Link to={`/events/${event.id}`} className="bwr-card-btn">View Details</Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   4. WISEIN (Continuation UI)
   ========================================================= */
export function WiseinSection() {
  return (
    <section className="wisein-product-section">
      <div className="wps-container">
        
        <div className="wps-visual">
          <div className="wisein-ui-mock">
            <div className="wu-sidebar">
              <div className="wu-logo">WiseIN</div>
              <div className="wu-nav-item is-active">Home</div>
              <div className="wu-nav-item">Network</div>
              <div className="wu-nav-item">Opportunities</div>
            </div>
            <div className="wu-main">
              <div className="wu-feed-post">
                <div className="wu-post-header">
                  <div className="wu-post-av">B</div>
                  <div className="wu-post-meta">
                    <div className="wu-post-name">Bhuvana</div>
                    <div className="wu-post-role">Product Designer</div>
                  </div>
                  <div className="wu-badge">1st</div>
                </div>
                <div className="wu-post-content">
                  Excited to share that we are hiring! Looking for talented engineers to join our growing team. Met some great candidates at the event yesterday via TapByWisein. Let's connect!
                </div>
                <div className="wu-post-action">Message Bhuvana</div>
              </div>
            </div>
          </div>
        </div>

        <div className="wps-content">
          <div className="section-subtitle">WISEIN</div>
          <h2 className="wps-title">WHERE CONNECTIONS CONTINUE.</h2>
          <div className="wps-flow">
            <span>TapByWisein</span> → <span>Connection</span> → <span className="text-blue">WiseIN Network</span>
          </div>
          <p className="wps-desc">TapByWisein starts the relationship. WiseIN gives that relationship somewhere to grow. Discover people, continue conversations, and find professional opportunities.</p>
          <a className="cta" href="https://www.wisein.in/" target="_blank" rel="noopener noreferrer">
            EXPLORE WISEIN
            <Arrow />
          </a>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   5. FINAL FOOTER ANIMATION & CTA
   ========================================================= */
export function AnimatedFooterSection() {
  const [isVisible, setIsVisible] = useState(false);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsVisible(true);
      }
    }, { threshold: 0.3 });
    
    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="animated-footer-section" ref={footerRef}>
      <div className={`fcs-content ${isVisible ? 'is-visible' : ''}`}>
        <h2 className="fcs-title">
          <span className="fcs-line1">ONE TAP.</span>
          <span className="fcs-line2">A CONNECTION THAT CONTINUES.</span>
        </h2>
        
        <Link className="fss-btn" to="/tapbywisein/product">
          EXPLORE TAPBYWISEIN
          <Arrow />
        </Link>
      </div>

      <div className="afs-footer-nav">
        <div className="afs-links">
          <Link to="/">TapByWisein</Link>
          <Link to="/discover">ByWisein</Link>
          <a href="https://www.wisein.in/">WiseIN</a>
          <Link to="/login">Sign In</Link>
        </div>
        <div className="afs-legal">
          © {new Date().getFullYear()} TapByWiseIN. Part of the WiseIN ecosystem.
        </div>
      </div>
    </footer>
  );
}
