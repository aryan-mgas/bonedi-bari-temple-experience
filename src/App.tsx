import { useEffect, useState } from 'react'
import BonediScene from './BonediScene.tsx'

export default function App() {
  const [exploring, setExploring] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [journeyProgress, setJourneyProgress] = useState(0)
  const chapter = journeyProgress < 0.22
    ? { eyebrow: 'A family celebration', title: 'The mandap' }
    : journeyProgress < 0.4
      ? { eyebrow: 'Crossing the threshold', title: 'The entrance' }
      : journeyProgress < 0.76
        ? { eyebrow: 'Within the mandap', title: 'The inner passage' }
        : { eyebrow: 'At the heart of the mandap', title: 'The sanctum' }

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return <main className="immersive-site">
    <section className="journey-track" id="journey" aria-label="Journey from the Durga Pujo mandap entrance into its interior">
      <div className="journey-viewport">
        <div className="scene-aura" aria-hidden="true" />
        <BonediScene
          exploring={exploring}
          onProgress={setLoadingProgress}
          onJourneyProgress={setJourneyProgress}
          onReady={() => setModelStatus('ready')}
          onError={() => setModelStatus('error')}
        />
        <div className="scene-vignette" aria-hidden="true" />

        <header className="journey-header">
          <a className="journey-brand" href="#journey" aria-label="Bonedi Bari Pujo, return to the mandap interior">
            <span className="journey-seal" aria-hidden="true"><span>শ্রী</span></span>
            <span className="brand-copy"><strong>Bonedi Bari Pujo</strong><small>A family tradition</small></span>
          </a>
          <div className="header-actions">
            <div className="journey-status" aria-live="polite"><span className="status-dot" />{exploring ? 'FREE LOOK · 360°' : 'MANDAP INTERIOR'}</div>
            <button className="explore-toggle" type="button" aria-pressed={exploring} onClick={() => setExploring((value) => !value)}>
              <span className="orbit-icon" aria-hidden="true">◉</span>{exploring ? 'Return to fixed view' : 'Explore in 360°'}
            </button>
          </div>
        </header>

        <div className="scene-caption" aria-live="polite">
          <span className="caption-index"><span>0{journeyProgress < 0.22 ? '1' : journeyProgress < 0.4 ? '2' : journeyProgress < 0.76 ? '3' : '4'}</span><i /><span>04</span></span>
          <div className="caption-copy"><span className="caption-kicker">{chapter.eyebrow}</span><h1>{chapter.title}</h1></div>
        </div>

        {exploring && <div className="explore-hint"><span>DRAG TO LOOK AROUND <i /> PINCH TO ZOOM</span><small>Explore the mandap interior</small></div>}
        {!exploring && <div className="scroll-invitation"><span className="scroll-wheel" aria-hidden="true" /><span>Scroll to enter the mandap</span></div>}

        <div className={`model-loader ${modelStatus === 'ready' ? 'is-ready' : ''}`} role={modelStatus === 'error' ? 'alert' : 'status'} aria-live="polite" aria-hidden={modelStatus === 'ready'}>
          {modelStatus === 'error' ? <><span className="loader-error-mark">!</span><span className="loader-copy"><strong>The mandap could not be opened</strong><small>Check your connection and refresh to try again.</small></span><button className="loader-retry" type="button" onClick={() => window.location.reload()}>Refresh page ↗</button></> : <>
            <span className="loader-seal" aria-hidden="true">শ্রী</span>
            <span className="loader-copy"><strong>Preparing the mandap</strong><small>{loadingProgress > 0 ? `${Math.round(loadingProgress)}% · bringing the details into view` : 'A moment, as the doors open'}</small></span>
            <span className="loader-track" role="progressbar" aria-label="Loading the 3D mandap" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(loadingProgress)}><i style={{ width: `${Math.max(loadingProgress, 5)}%` }} /></span>
          </>}
        </div>
      </div>
    </section>
  </main>
}
