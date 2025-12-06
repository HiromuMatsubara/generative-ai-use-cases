import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageCode } from '@aws-sdk/client-transcribe-streaming';
import { Transcript } from 'generative-ai-use-cases';
import Button from '../Button';
import ButtonCopy from '../ButtonCopy';
import ButtonSendToUseCase from '../ButtonSendToUseCase';
import Select from '../Select';
import RangeSlider from '../RangeSlider';
import TogglePillButton from '../TogglePillButton';
import Help from '../Help';
import MeetingMinutesTranscriptSegment from './MeetingMinutesTranscriptSegment';
import {
  PiStopCircleBold,
  PiMicrophoneBold,
  PiDesktopBold,
  PiUsersBold,
} from 'react-icons/pi';
import useMicrophone from '../../hooks/useMicrophone';
import useScreenAudio from '../../hooks/useScreenAudio';

// Simplified transcript segment for transcription only
interface TranscriptionSegment {
  resultId: string;
  source: 'microphone' | 'screen';
  startTime: number;
  endTime: number;
  isPartial: boolean;
  transcripts: Transcript[];
  sessionId: number;
}

interface MeetingMinutesTranscriptionProps {
  /** Callback when transcript text changes */
  onTranscriptChange?: (text: string) => void;
  /** Callback when recording state changes */
  onRecordingStateChange?: (state: {
    micRecording: boolean;
    screenRecording: boolean;
  }) => void;
}

const MeetingMinutesTranscription: React.FC<
  MeetingMinutesTranscriptionProps
> = ({ onTranscriptChange, onRecordingStateChange }) => {
  const { t, i18n } = useTranslation();
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef<boolean>(true);

  // Microphone and screen audio hooks
  const {
    startTranscription: startMicTranscription,
    stopTranscription: stopMicTranscription,
    recording: micRecording,
    clearTranscripts: clearMicTranscripts,
    rawTranscripts: micRawTranscripts,
  } = useMicrophone();

  const {
    prepareScreenCapture,
    startTranscriptionWithStream,
    stopTranscription: stopScreenTranscription,
    recording: screenRecording,
    clearTranscripts: clearScreenTranscripts,
    isSupported: isScreenAudioSupported,
    error: screenAudioError,
    rawTranscripts: screenRawTranscripts,
  } = useScreenAudio();

  // Notify parent component of recording state changes
  useEffect(() => {
    onRecordingStateChange?.({
      micRecording,
      screenRecording,
    });
  }, [micRecording, screenRecording, onRecordingStateChange]);

  // Internal state management
  const [languageCode, setLanguageCode] = useState('auto');
  const [speakerLabel, setSpeakerLabel] = useState(false);
  const [maxSpeakers, setMaxSpeakers] = useState(4);
  const [speakers, setSpeakers] = useState('');
  const [enableScreenAudio, setEnableScreenAudio] = useState(false);
  const [enableMicAudio, setEnableMicAudio] = useState(true);
  const [transcriptionSegments, setTranscriptionSegments] = useState<
    TranscriptionSegment[]
  >([]);

  // Simple session management
  const [currentSessionId, setCurrentSessionId] = useState(0);

  // Language options
  const languageOptions = useMemo(
    () => [
      { value: 'auto', label: t('meetingMinutes.language_auto') },
      { value: 'ja-JP', label: t('meetingMinutes.language_japanese') },
      { value: 'en-US', label: t('meetingMinutes.language_english') },
      { value: 'zh-CN', label: t('meetingMinutes.language_chinese') },
      { value: 'ko-KR', label: t('meetingMinutes.language_korean') },
      { value: 'th-TH', label: t('meetingMinutes.language_thai') },
      { value: 'vi-VN', label: t('meetingMinutes.language_vietnamese') },
    ],
    [t]
  );

  // Speaker mapping
  const speakerMapping = useMemo(() => {
    return Object.fromEntries(
      speakers.split(',').map((speaker, idx) => [`spk_${idx}`, speaker.trim()])
    );
  }, [speakers]);

  // Map i18n language to transcription language
  const getTranscriptionLanguageFromSettings = useCallback(
    (settingsLang: string): string => {
      const langMapping: { [key: string]: string } = {
        ja: 'ja-JP',
        en: 'en-US',
        zh: 'zh-CN',
        ko: 'ko-KR',
        th: 'th-TH',
        vi: 'vi-VN',
      };
      return langMapping[settingsLang] || 'auto';
    },
    []
  );

  // Set language from settings on mount
  useEffect(() => {
    if (i18n.resolvedLanguage && languageCode === 'auto') {
      const mappedLang = getTranscriptionLanguageFromSettings(
        i18n.resolvedLanguage
      );
      if (mappedLang !== 'auto') {
        setLanguageCode(mappedLang);
      }
    }
  }, [
    i18n.resolvedLanguage,
    languageCode,
    getTranscriptionLanguageFromSettings,
  ]);

  // Helper function to format time in MM:SS format
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Real-time text output
  const transcriptionText: string = useMemo(() => {
    const sortedSegments = [...transcriptionSegments].sort((a, b) => {
      // Sort by session ID first, then by time within each session
      if (a.sessionId !== b.sessionId) {
        return a.sessionId - b.sessionId;
      }
      return a.startTime - b.startTime;
    });

    return sortedSegments
      .map((segment) => {
        const timeStr = `[${formatTime(segment.startTime)}]`;
        const partialIndicator = segment.isPartial ? ' (...)' : '';

        return segment.transcripts
          .map((transcript) => {
            const speakerLabel = transcript.speakerLabel
              ? `${speakerMapping[transcript.speakerLabel] || transcript.speakerLabel}: `
              : '';
            return `${timeStr} ${speakerLabel}${transcript.transcript}${partialIndicator}`;
          })
          .join('\n');
      })
      .join('\n');
  }, [transcriptionSegments, speakerMapping, formatTime]);

  // Auto scroll to bottom when transcript updates if user was at bottom
  useEffect(() => {
    if (
      transcriptContainerRef.current &&
      isAtBottomRef.current &&
      transcriptionSegments.length > 0
    ) {
      setTimeout(() => {
        if (transcriptContainerRef.current) {
          transcriptContainerRef.current.scrollTop =
            transcriptContainerRef.current.scrollHeight;
        }
      }, 10);
    }
  }, [transcriptionSegments]);

  // Text existence check
  const hasTranscriptText = useMemo(() => {
    return transcriptionText.trim() !== '';
  }, [transcriptionText]);

  // Update callback when transcript changes
  useEffect(() => {
    onTranscriptChange?.(transcriptionText);
  }, [transcriptionText, onTranscriptChange]);

  // Real-time integration of raw transcripts
  const updateTranscriptionSegments = useCallback(
    (newSegment: TranscriptionSegment) => {
      setTranscriptionSegments((prev) => {
        const existingIndex = prev.findIndex(
          (seg) =>
            seg.resultId === newSegment.resultId &&
            seg.source === newSegment.source
        );

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newSegment;
          return updated;
        } else {
          return [...prev, newSegment];
        }
      });
    },
    []
  );

  // Process microphone raw transcripts
  useEffect(() => {
    if (micRawTranscripts && micRawTranscripts.length > 0) {
      const latestSegment = micRawTranscripts[micRawTranscripts.length - 1];

      const segment: TranscriptionSegment = {
        resultId: latestSegment.resultId,
        source: 'microphone',
        startTime: latestSegment.startTime,
        endTime: latestSegment.endTime,
        isPartial: latestSegment.isPartial,
        transcripts: latestSegment.transcripts,
        sessionId: currentSessionId,
      };
      updateTranscriptionSegments(segment);
    }
  }, [micRawTranscripts, updateTranscriptionSegments, currentSessionId]);

  // Process screen audio raw transcripts
  useEffect(() => {
    if (
      enableScreenAudio &&
      screenRawTranscripts &&
      screenRawTranscripts.length > 0
    ) {
      const latestSegment =
        screenRawTranscripts[screenRawTranscripts.length - 1];

      const segment: TranscriptionSegment = {
        resultId: latestSegment.resultId,
        source: 'screen',
        startTime: latestSegment.startTime,
        endTime: latestSegment.endTime,
        isPartial: latestSegment.isPartial,
        transcripts: latestSegment.transcripts,
        sessionId: currentSessionId,
      };
      updateTranscriptionSegments(segment);
    }
  }, [
    screenRawTranscripts,
    enableScreenAudio,
    updateTranscriptionSegments,
    currentSessionId,
  ]);

  // Recording states
  const isRecording = micRecording || screenRecording;

  // Clear function
  const handleClear = useCallback(() => {
    setTranscriptionSegments([]);
    stopMicTranscription();
    stopScreenTranscription();
    clearMicTranscripts();
    clearScreenTranscripts();

    // Reset session state for fresh start
    setCurrentSessionId(0);

    onTranscriptChange?.('');
  }, [
    stopMicTranscription,
    stopScreenTranscription,
    clearMicTranscripts,
    clearScreenTranscripts,
    onTranscriptChange,
  ]);

  // Start transcription
  const onClickExecStartTranscription = useCallback(async () => {
    // Simple session management - just increment session ID when recording starts
    setCurrentSessionId((prev) => prev + 1);

    // Clear only the hooks' internal state, but preserve our segments
    clearMicTranscripts();
    clearScreenTranscripts();

    const langCode =
      languageCode === 'auto' ? undefined : (languageCode as LanguageCode);

    try {
      let screenStream: MediaStream | null = null;
      if (enableScreenAudio && isScreenAudioSupported) {
        screenStream = await prepareScreenCapture();
      }

      if (screenStream) {
        startTranscriptionWithStream(screenStream, langCode, speakerLabel);
      }
      if (enableMicAudio) {
        startMicTranscription(langCode, speakerLabel);
      }
    } catch (error) {
      console.error('Failed to start synchronized recording:', error);
      if (enableMicAudio) {
        startMicTranscription(langCode, speakerLabel);
      }
    }
  }, [
    languageCode,
    speakerLabel,
    startMicTranscription,
    enableScreenAudio,
    enableMicAudio,
    isScreenAudioSupported,
    prepareScreenCapture,
    startTranscriptionWithStream,
    clearMicTranscripts,
    clearScreenTranscripts,
  ]);

  return (
    <div className="flex h-full flex-col">
      {/* Settings Panel */}
      {!isRecording && (
        <div className="mb-4 shrink-0 rounded-lg border border-gray-200 p-4">
          <div className="mb-3 text-sm font-bold text-gray-700">
            {t('meetingMinutes.settings')}
          </div>

          {/* Input Source */}
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="text-sm text-gray-600 sm:w-28 sm:shrink-0">
              {t('meetingMinutes.input_source')}
            </div>
            <div className="flex flex-wrap gap-2">
              <TogglePillButton
                icon={<PiMicrophoneBold className="h-4 w-4" />}
                label={t('meetingMinutes.microphone')}
                isEnabled={enableMicAudio}
                onToggle={() => setEnableMicAudio(!enableMicAudio)}
                activeColor="blue"
              />
              {isScreenAudioSupported && (
                <>
                  <TogglePillButton
                    icon={<PiDesktopBold className="h-4 w-4" />}
                    label={t('transcribe.screen_audio')}
                    isEnabled={enableScreenAudio}
                    onToggle={() => setEnableScreenAudio(!enableScreenAudio)}
                    activeColor="blue"
                  />
                  <Help
                    position="center"
                    message={t('transcribe.screen_audio_notice')}
                  />
                </>
              )}
            </div>
          </div>

          {/* Option */}
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="text-sm text-gray-600 sm:w-28 sm:shrink-0">
              {t('meetingMinutes.option')}
            </div>
            <div className="flex flex-wrap gap-2">
              <TogglePillButton
                icon={<PiUsersBold className="h-4 w-4" />}
                label={t('transcribe.speaker_recognition')}
                isEnabled={speakerLabel}
                onToggle={() => setSpeakerLabel(!speakerLabel)}
                activeColor="gray"
              />
            </div>
          </div>

          {/* Speaker Recognition Parameters (when enabled) */}
          {speakerLabel && (
            <div className="mb-3">
              <div className="mb-2 text-sm font-medium text-gray-700">
                {t('transcribe.detailed_parameters')}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <RangeSlider
                  className=""
                  label={t('transcribe.max_speakers')}
                  min={2}
                  max={10}
                  value={maxSpeakers}
                  onChange={setMaxSpeakers}
                  help={t('transcribe.max_speakers_help')}
                />
              </div>
              <div className="mt-2">
                <textarea
                  className="w-full rounded border border-black/30 p-2 text-sm"
                  placeholder={t('transcribe.speaker_names')}
                  value={speakers}
                  onChange={(e) => setSpeakers(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Language */}
          <div className="flex items-center gap-4">
            <div className="flex h-9 w-28 shrink-0 items-center text-sm text-gray-600">
              {t('meetingMinutes.language')}
            </div>
            <div className="flex w-48 items-center">
              <Select
                value={languageCode}
                onChange={setLanguageCode}
                options={languageOptions}
                fullWidth
                notItem
              />
            </div>
          </div>
        </div>
      )}

      {/* Screen Audio Error Display */}
      {screenAudioError && (
        <div className="mb-3 shrink-0 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <strong>{t('meetingMinutes.screen_audio_error')}</strong>
          {t('common.colon')} {screenAudioError}
        </div>
      )}

      {/* Transcript Panel */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex shrink-0 items-center justify-between">
          <div className="font-bold">{t('meetingMinutes.transcript')}</div>
          <div className="flex items-center gap-2">
            {!isRecording && (
              <Button
                className="h-8 px-3 py-1 text-sm"
                onClick={onClickExecStartTranscription}
                outlined>
                <PiMicrophoneBold className="mr-1 h-4 w-4" />
                {t('transcribe.start_recording')}
              </Button>
            )}
            {hasTranscriptText && (
              <>
                <ButtonCopy
                  text={transcriptionText}
                  interUseCasesKey="transcript"
                />
                <ButtonSendToUseCase text={transcriptionText} />
              </>
            )}
            {isRecording && (
              <Button
                className="h-8 px-3 py-1 text-sm"
                onClick={() => {
                  stopMicTranscription();
                  stopScreenTranscription();
                }}>
                <PiStopCircleBold className="mr-1 h-4 w-4" />
                {t('transcribe.stop_recording')}
              </Button>
            )}
            <Button
              outlined
              className="h-8 px-3 py-1 text-sm"
              disabled={!hasTranscriptText && !isRecording}
              onClick={handleClear}>
              {t('common.clear')}
            </Button>
          </div>
        </div>
        <div
          ref={transcriptContainerRef}
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            const distanceFromBottom =
              target.scrollHeight - target.clientHeight - target.scrollTop;
            const isAtBottom = distanceFromBottom < 80; // About 3-4 lines tolerance
            isAtBottomRef.current = isAtBottom;
          }}
          className="relative min-h-0 flex-1 overflow-y-auto rounded border border-black/30 p-1.5">
          {transcriptionSegments.length === 0 && !isRecording ? (
            <div className="flex h-full items-center justify-center py-8">
              <div className="text-center text-gray-500">
                {t('transcribe.result_placeholder')}
              </div>
            </div>
          ) : (
            [...transcriptionSegments]
              .sort((a, b) => {
                // Sort by session ID first, then by time within each session
                if (a.sessionId !== b.sessionId) {
                  return a.sessionId - b.sessionId;
                }
                return a.startTime - b.startTime;
              })
              .map((segment, index, sortedSegments) => {
                const prevSegment =
                  index > 0 ? sortedSegments[index - 1] : null;
                const isNewSession =
                  prevSegment && segment.sessionId !== prevSegment.sessionId;

                return (
                  <React.Fragment
                    key={`${segment.resultId}-${segment.source}-${index}`}>
                    {isNewSession && (
                      <div className="my-4 flex items-center px-2">
                        <div className="grow border-t border-gray-300"></div>
                        <div className="mx-4 rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-sm text-blue-700">
                          {t('meetingMinutes.new_recording_session')}
                        </div>
                        <div className="grow border-t border-gray-300"></div>
                      </div>
                    )}
                    <MeetingMinutesTranscriptSegment
                      startTime={segment.startTime}
                      transcripts={segment.transcripts}
                      speakerMapping={speakerMapping}
                      isPartial={segment.isPartial}
                      formatTime={formatTime}
                      translation={''}
                      translationSegments={[]}
                      isTranslating={false}
                      translationEnabled={false}
                      detectedLanguage={undefined}
                      translationTarget={undefined}
                      isBidirectional={false}
                    />
                  </React.Fragment>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingMinutesTranscription;
