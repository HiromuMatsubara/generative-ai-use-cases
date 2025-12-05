import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Button from '../Button';
import ButtonCopy from '../ButtonCopy';
import Select from '../Select';
import Switch from '../Switch';
import Textarea from '../Textarea';
import Markdown from '../Markdown';
import useMeetingMinutes from '../../hooks/useMeetingMinutes';
import { MODELS } from '../../hooks/useModel';
import { MeetingMinutesParams } from '../../prompts';

interface MeetingMinutesGenerationProps {
  /** Current transcript text to generate minutes from */
  transcriptText: string;
}

const MeetingMinutesGeneration: React.FC<MeetingMinutesGenerationProps> = ({
  transcriptText,
}) => {
  const { t } = useTranslation();
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const shouldGenerateRef = useRef<boolean>(false);

  // Internal state management
  const [minutesStyle, setMinutesStyle] =
    useState<MeetingMinutesParams['style']>('summary');
  const [customPrompt, setCustomPrompt] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [generationFrequency, setGenerationFrequency] = useState(5);
  const [autoGenerateSessionTimestamp] = useState<number | null>(null);
  const [generatedMinutes, setGeneratedMinutes] = useState('');
  const [countdownSeconds, setCountdownSeconds] = useState(0);

  // Model selection
  const { modelIds: availableModels, modelDisplayName } = MODELS;
  const [modelId, setModelId] = useState(availableModels[0] || '');

  // Meeting minutes hook
  const {
    loading: minutesLoading,
    generateMinutes,
    clearMinutes,
  } = useMeetingMinutes(
    minutesStyle,
    customPrompt,
    autoGenerateSessionTimestamp,
    setGeneratedMinutes,
    () => {}, // Empty function for setLastProcessedTranscript
    () => {} // Empty function for setLastGeneratedTime
  );

  // Text existence check
  const hasTranscriptText = useMemo(() => {
    return transcriptText.trim() !== '';
  }, [transcriptText]);

  // Watch for generation signal and trigger generation
  useEffect(() => {
    if (
      shouldGenerateRef.current &&
      autoGenerate &&
      transcriptText.trim() !== ''
    ) {
      if (!minutesLoading) {
        shouldGenerateRef.current = false;
        generateMinutes(transcriptText, modelId, (status) => {
          if (status === 'success') {
            toast.success(t('meetingMinutes.generation_success'));
          } else if (status === 'error') {
            toast.error(t('meetingMinutes.generation_error'));
          }
        });
      } else {
        shouldGenerateRef.current = false;
      }
    }
  }, [
    countdownSeconds,
    autoGenerate,
    transcriptText,
    minutesLoading,
    generateMinutes,
    modelId,
    t,
  ]);

  // Auto-generation countdown setup
  useEffect(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (!autoGenerate || generationFrequency <= 0) {
      setCountdownSeconds(0);
      return;
    }

    const totalSeconds = generationFrequency * 60;
    setCountdownSeconds(totalSeconds);

    countdownIntervalRef.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        const newValue = prev - 1;
        if (newValue <= 0) {
          shouldGenerateRef.current = true;
          return totalSeconds;
        }
        return newValue;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [autoGenerate, generationFrequency]);

  // Manual generation handler
  const handleManualGeneration = useCallback(() => {
    if (
      minutesStyle === 'custom' &&
      (!customPrompt || customPrompt.trim() === '')
    ) {
      toast.error(t('meetingMinutes.custom_prompt_placeholder'));
      return;
    }

    if (hasTranscriptText && !minutesLoading) {
      generateMinutes(transcriptText, modelId, (status) => {
        if (status === 'success') {
          toast.success(t('meetingMinutes.generation_success'));
        } else if (status === 'error') {
          toast.error(t('meetingMinutes.generation_error'));
        }
      });
    }
  }, [
    hasTranscriptText,
    transcriptText,
    minutesLoading,
    modelId,
    generateMinutes,
    t,
    minutesStyle,
    customPrompt,
  ]);

  // Clear minutes handler
  const handleClearMinutes = useCallback(() => {
    clearMinutes();
  }, [clearMinutes]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Meeting Minutes Configuration */}
      <div className="mb-3 shrink-0">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-2 block font-bold">
              {t('meetingMinutes.style')}
            </label>
            <Select
              value={minutesStyle}
              onChange={(value) =>
                setMinutesStyle(value as typeof minutesStyle)
              }
              options={[
                {
                  value: 'summary',
                  label: t('meetingMinutes.style_summary'),
                },
                {
                  value: 'detail',
                  label: t('meetingMinutes.style_detail'),
                },
                {
                  value: 'faq',
                  label: t('meetingMinutes.style_faq'),
                },
                {
                  value: 'transcription',
                  label: t('meetingMinutes.style_transcription'),
                },
                {
                  value: 'diagram',
                  label: t('meetingMinutes.style_diagram'),
                },
                {
                  value: 'newspaper',
                  label: t('meetingMinutes.style_newspaper'),
                },
                {
                  value: 'custom',
                  label: t('meetingMinutes.style_custom'),
                },
              ]}
            />
          </div>

          <div>
            <label className="mb-2 block font-bold">
              {t('meetingMinutes.model')}
            </label>
            <Select
              value={modelId}
              onChange={setModelId}
              options={availableModels.map((id) => ({
                value: id,
                label: modelDisplayName(id),
              }))}
            />
          </div>
        </div>

        {minutesStyle === 'custom' && (
          <div className="mt-3">
            <label className="mb-1 block text-sm font-bold">
              {t('meetingMinutes.custom_prompt')}
            </label>
            <Textarea
              placeholder={t('meetingMinutes.custom_prompt_placeholder')}
              value={customPrompt}
              onChange={setCustomPrompt}
              maxHeight={60}
            />
          </div>
        )}

        {/* Auto-generation controls */}
        <div className="mt-3">
          <Switch
            label={t('meetingMinutes.auto_generate')}
            checked={autoGenerate}
            onSwitch={setAutoGenerate}
          />
          {autoGenerate && (
            <div className="mt-2">
              <label className="mb-1 block text-sm font-bold">
                {t('meetingMinutes.generation_frequency')}
              </label>
              <Select
                value={generationFrequency.toString()}
                onChange={(value) => setGenerationFrequency(Number(value))}
                options={[
                  { value: '1', label: t('meetingMinutes.frequency_1min') },
                  { value: '3', label: t('meetingMinutes.frequency_3min') },
                  { value: '5', label: t('meetingMinutes.frequency_5min') },
                  {
                    value: '10',
                    label: t('meetingMinutes.frequency_10min'),
                  },
                ]}
              />
              {countdownSeconds > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  {t('meetingMinutes.next_generation')}
                  {t('common.colon')} {Math.floor(countdownSeconds / 60)}
                  {t('common.colon')}
                  {(countdownSeconds % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Generation buttons */}
      <div className="mb-3 flex shrink-0 gap-2">
        <Button
          disabled={!hasTranscriptText || minutesLoading}
          onClick={handleManualGeneration}
          loading={minutesLoading}>
          {t('meetingMinutes.generate')}
        </Button>
        <Button outlined onClick={handleClearMinutes}>
          {t('meetingMinutes.clear_minutes')}
        </Button>
      </div>

      {/* Generated minutes display */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex shrink-0 items-center justify-between">
          <div className="font-bold">
            {t('meetingMinutes.generated_minutes')}
          </div>
          {generatedMinutes && (
            <div className="flex">
              <ButtonCopy text={generatedMinutes} interUseCasesKey="minutes" />
            </div>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded border border-black/30 p-3">
          {generatedMinutes ? (
            <Markdown>{generatedMinutes}</Markdown>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              {t('meetingMinutes.minutes_placeholder')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingMinutesGeneration;
