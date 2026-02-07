/**
 * OnboardingFlow — 3-step guided setup for new users
 * 
 * Steps:
 * 1. Avatar selection
 * 2. Camera activation
 * 3. OBS configuration
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Camera, Monitor, ChevronRight, ChevronLeft, Sparkles,
  X, Check, Copy, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAvatarStore, useTranslation } from '@/stores/avatarStore';
import type { AvatarType } from '@/stores/slices/avatarSlice';
import { useFaceTracker } from '@/hooks/useFaceTracker';
import { toast } from '@/hooks/use-toast';

// =============================================================================
// Avatar Options
// =============================================================================

const AVATAR_OPTIONS: { type: AvatarType; icon: string; labelKey: string }[] = [
  { type: 'pill', icon: '🥜', labelKey: 'peanut' },
  { type: 'boxy', icon: '🤖', labelKey: 'robot' },
  { type: 'sphere', icon: '🟢', labelKey: 'slime' },
  { type: 'cat', icon: '🐱', labelKey: 'cat' },
  { type: 'ghost', icon: '👻', labelKey: 'ghost' },
  { type: 'emoji', icon: '😀', labelKey: 'emoji' },
];

// =============================================================================
// Step Components
// =============================================================================

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

const StepAvatarSelect = ({ onNext }: StepProps) => {
  const { selectedAvatar, setSelectedAvatar } = useAvatarStore();
  const t = useTranslation();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-2">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-display font-bold text-foreground">
          {t.onboardingStep1Title}
        </h3>
        <p className="text-sm text-muted-foreground">{t.onboardingStep1Desc}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {AVATAR_OPTIONS.map(({ type, icon, labelKey }) => (
          <button
            key={type}
            onClick={() => setSelectedAvatar(type)}
            className={`
              flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200
              ${selectedAvatar === type
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-105'
                : 'border-border bg-card hover:border-muted-foreground/30 hover:bg-card/80'
              }
            `}
          >
            <span className="text-3xl">{icon}</span>
            <span className="text-xs font-medium text-foreground">
              {t[labelKey as keyof typeof t] || labelKey}
            </span>
            {selectedAvatar === type && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-primary-foreground" />
              </motion.div>
            )}
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">{t.onboardingSelectAvatar}</p>

      <Button onClick={onNext} className="w-full gap-2" size="lg">
        {t.onboardingNext}
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

const StepCameraSetup = ({ onNext, onBack }: StepProps) => {
  const t = useTranslation();
  const { videoRef, startCamera, stopCamera, isLoading, isCameraActive } = useFaceTracker();

  const handleActivate = async () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      await startCamera();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-2">
          <Camera className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-display font-bold text-foreground">
          {t.onboardingStep2Title}
        </h3>
        <p className="text-sm text-muted-foreground">{t.onboardingStep2Desc}</p>
      </div>

      {/* Camera preview */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted border border-border">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted">
            <Camera className="w-12 h-12 text-muted-foreground/50" />
            <span className="text-sm text-muted-foreground">{t.cameraInactive}</span>
          </div>
        )}
        {isCameraActive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/20 border border-success/30">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium text-success">{t.trackingOk}</span>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleActivate}
          variant={isCameraActive ? 'destructive' : 'default'}
          className="flex-1 gap-2"
          disabled={isLoading}
        >
          <Camera className="w-4 h-4" />
          {isLoading ? t.starting : isCameraActive ? t.stopCamera : t.startCamera}
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">{t.onboardingCameraHint}</p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 gap-2">
          <ChevronLeft className="w-4 h-4" />
          {t.onboardingBack}
        </Button>
        <Button onClick={onNext} className="flex-1 gap-2">
          {isCameraActive ? t.onboardingNext : t.onboardingActivateLater}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const StepOBSSetup = ({ onBack }: StepProps & { onFinish: () => void }) => {
  const t = useTranslation();

  const cleanViewUrl = `${window.location.origin}/view?bg=chroma-green`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanViewUrl);
    toast({
      title: t.linkCopied,
      description: t.useAsOBS,
    });
  };

  const handleOpen = () => {
    window.open(cleanViewUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-2">
          <Monitor className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-display font-bold text-foreground">
          {t.onboardingStep3Title}
        </h3>
        <p className="text-sm text-muted-foreground">{t.onboardingStep3Desc}</p>
      </div>

      {/* OBS Steps */}
      <div className="space-y-3">
        {[
          { step: 1, text: 'Abre OBS Studio', icon: '🖥️' },
          { step: 2, text: 'Fuentes → + → Browser Source', icon: '➕' },
          { step: 3, text: 'Pega el link de Vista Limpia', icon: '📋' },
          { step: 4, text: 'Aplica filtro "Chroma Key"', icon: '🎨' },
        ].map(({ step, text, icon }) => (
          <div
            key={step}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{step}</span>
            </div>
            <span className="text-sm text-foreground">{text}</span>
            <span className="ml-auto text-lg">{icon}</span>
          </div>
        ))}
      </div>

      {/* Clean View URL */}
      <div className="p-3 rounded-lg bg-card border border-border">
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          {t.cleanView}
        </label>
        <div className="flex gap-2">
          <code className="flex-1 px-3 py-2 rounded-md bg-muted text-xs text-foreground font-mono truncate">
            {cleanViewUrl}
          </code>
          <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1">
            <Copy className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleOpen} className="gap-1">
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">{t.onboardingOBSHint}</p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 gap-2">
          <ChevronLeft className="w-4 h-4" />
          {t.onboardingBack}
        </Button>
      </div>
    </div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState(0);
  const t = useTranslation();
  const { setOnboardingCompleted } = useAvatarStore();

  const handleFinish = () => {
    setOnboardingCompleted(true);
    onComplete();
  };

  const handleSkip = () => {
    setOnboardingCompleted(true);
    onComplete();
  };

  const steps = [
    { component: StepAvatarSelect, label: t.onboardingStep1Title },
    { component: StepCameraSetup, label: t.onboardingStep2Title },
    { component: StepOBSSetup, label: t.onboardingStep3Title },
  ];

  const CurrentStep = steps[step].component;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md mx-4"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-2 mb-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-neon-pink flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-display font-bold gradient-text">
              StreamAvatar
            </h2>
          </motion.div>
          {step === 0 && (
            <p className="text-sm text-muted-foreground">
              {t.onboardingSubtitle}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className={`w-full h-1.5 rounded-full transition-all duration-300 ${
                  i <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  i <= step ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="glass-panel p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <StepAvatarSelect onNext={() => setStep(1)} />
              )}
              {step === 1 && (
                <StepCameraSetup onNext={() => setStep(2)} onBack={() => setStep(0)} />
              )}
              {step === 2 && (
                <StepOBSSetup onBack={() => setStep(1)} onNext={handleFinish} onFinish={handleFinish} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={handleSkip}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
          >
            {t.onboardingSkip}
          </button>

          {step === 2 && (
            <Button onClick={handleFinish} className="gap-2">
              <Sparkles className="w-4 h-4" />
              {t.onboardingFinish}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
