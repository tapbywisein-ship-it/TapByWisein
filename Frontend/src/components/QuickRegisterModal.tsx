import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, CheckCircle2, MapPin, Tag, Ticket, Users, X } from 'lucide-react';
import { Surface } from '@/components/Surface';
import { Button } from '@/components/ui/button';
import { EventQuestionsForm } from '@/components/EventQuestionsForm';
import { toAnswerList, unansweredRequired, type AnswerMap } from '@/lib/eventQuestions';
import { useAppStore } from '@/store/appStore';
import { useRegisterForEvent, useEventQuestions } from '@/hooks/useEvents';
import { getRegistrationPricing } from '@/lib/ticketPricing';
import type { Event } from '@/services/events.service';

/**
 * The "Register" popup for free events, moved out of the attendee Events page
 * so the event browser can use it on both Events pages.
 * It asks the host's custom questions (EventQuestionsForm, shared with the event page), registers,
 * then shows the QR ticket. Render it with key={event.id} so each event
 * starts fresh. It is drawn on document.body so no parent layout can clip it.
 */
export const QuickRegisterModal = ({ event, onClose }: { event: Event; onClose: () => void }) => {
  const user = useAppStore((s) => s.user);
  const registerMutation = useRegisterForEvent();
  const { data: questions } = useEventQuestions(event.id, true);
  const [step, setStep] = useState<'confirm' | 'success'>('confirm');
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const missingRequired = unansweredRequired(questions, answers);

  const handleRegister = async () => {
    const answerArr = toAnswerList(answers);
    const res = await registerMutation.mutateAsync({
      eventId: event.id,
      answers: answerArr.length > 0 ? answerArr : undefined,
    });
    const regId = (res as { data?: { registration?: { id?: string } } })?.data?.registration?.id ?? null;
    setRegistrationId(regId);
    setAnswers({});
    setStep('success');
  };

  const qrValue = registrationId
    ? `tapbywisein://registration/${registrationId}`
    : `tapbywisein://event/${event.id}/user/${user?.id}`;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && !registerMutation.isPending && onClose()}
    >
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-md">
        <Surface className="relative">
          {!registerMutation.isPending && (
            <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          )}

          <AnimatePresence mode="wait">
            {step === 'confirm' && (
              <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Ticket className="w-8 h-8 text-primary mb-4" />
                <h2 className="text-2xl font-semibold text-foreground mb-1">Register for Event</h2>
                <p className="text-muted-foreground text-sm mb-5">{event.title}</p>
                <div className="space-y-2 mb-6">
                  {[
                    { icon: Calendar, text: new Date(event.startDate).toLocaleString() },
                    { icon: MapPin, text: event.locationType === 'VIRTUAL' ? 'Online' : (event.city || event.address || 'Venue TBD') },
                    { icon: Tag, text: `Price: ${getRegistrationPricing(event).topLabel}` },
                    { icon: Users, text: `${event.registeredCount ?? 0} of ${event.capacity} registered` },
                  ].map(({ icon: Icon, text }, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                      {text}
                    </div>
                  ))}
                </div>
                <EventQuestionsForm questions={questions} answers={answers} onChange={setAnswers} className="mb-5" />
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleRegister}
                  disabled={registerMutation.isPending || missingRequired.length > 0}
                >
                  {registerMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                      Processing...
                    </span>
                  ) : 'Confirm Registration'}
                </Button>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
                </motion.div>
                <h2 className="text-2xl font-semibold text-foreground mb-1">You're registered!</h2>
                <p className="text-sm text-muted-foreground mb-4">Show your QR code at the gate.</p>
                <div className="bg-white p-4 rounded-2xl inline-block mb-5">
                  <QRCodeSVG
                    value={qrValue}
                    size={140}
                    bgColor="#ffffff"
                    fgColor="#0D0D0D"
                    level="M"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mb-5">
                  Registration ID: {registrationId ?? 'saved'}
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1" onClick={onClose}>Close</Button>
                  <Button className="flex-1" asChild>
                    <Link to={`/event/${event.id}`}>View Ticket</Link>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Surface>
      </motion.div>
    </motion.div>,
    document.body
  );
};
