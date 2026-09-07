import React, { useState, useEffect, useRef } from 'react';
import { Pattern, CategoryId, Difficulty, SeoMeta, PatternStep, PinterestBoard } from '../types';
import { updateHeadMetaTags } from '../utils/seoUtils';
import { notifyIndexNowClient } from '../utils/indexnow';
import { PinterestTemplateId, PINTEREST_TEMPLATES } from '../pinterest/templates';
import {
  X,
  Upload,
  Image as ImageIcon,
  Search,
  Globe,
  Sparkles,
  FileText,
  Tag,
  Share2,
  Check,
  Plus,
  Trash2,
  HelpCircle,
  Eye,
  Layers,
  Sliders,
  Code,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface PatternEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePattern: (pattern: Pattern) => void;
  initialPattern?: Pattern | null;
}

export const PatternEditorModal: React.FC<PatternEditorModalProps> = ({
  isOpen,
  onClose,
  onSavePattern,
  initialPattern
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'photo' | 'seo' | 'pinterest'>('write');

  // Form State
  const [title, setTitle] = useState(initialPattern?.title || '');
  const [subtitle, setSubtitle] = useState(initialPattern?.subtitle || '');
  const [category, setCategory] = useState<CategoryId>(initialPattern?.category || 'blankets');
  const [difficulty, setDifficulty] = useState<Difficulty>(initialPattern?.difficulty || 'Easy');
  const [description, setDescription] = useState(initialPattern?.description || '');
  const [hookSize, setHookSize] = useState(initialPattern?.hookSize || '5.0 mm (H-8)');
  const [yarnWeight, setYarnWeight] = useState(initialPattern?.yarnWeight || 'Medium / Worsted (#4)');
  const [gauge, setGauge] = useState(initialPattern?.gauge || '14 sts and 10 rows = 4 inches (10 cm)');
  const [materials, setMaterials] = useState<string>(initialPattern?.materials?.join(', ') || 'Worsted Yarn, 5mm Crochet Hook, Tapestry Needle, Scissors');
  const [pdfUrl, setPdfUrl] = useState<string>(initialPattern?.pdfUrl || '');

  // Steps
  const [steps, setSteps] = useState<PatternStep[]>(
    initialPattern?.steps || [
      { rowNumber: 'Row 1', instruction: 'Chain foundation stitches and double crochet across row.' },
      { rowNumber: 'Row 2', instruction: 'Turn work, chain 2, double crochet in each stitch across.' }
    ]
  );

  // Photos
  const [mainImage, setMainImage] = useState<string>(
    initialPattern?.image || 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80'
  );
  const [gallery, setGallery] = useState<string[]>(
    initialPattern?.gallery || [
      'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80'
    ]
  );

  // SEO Meta Tags State
  const [metaTitle, setMetaTitle] = useState<string>(
    initialPattern?.seoMeta?.metaTitle || (initialPattern ? `${initialPattern.title} - Free Crochet Pattern` : '')
  );
  const [metaDescription, setMetaDescription] = useState<string>(
    initialPattern?.seoMeta?.metaDescription || (initialPattern?.description || '')
  );
  const [metaKeywords, setMetaKeywords] = useState<string>(
    initialPattern?.seoMeta?.metaKeywords || 'crochet pattern, free crochet pattern, handmade, yarn pattern'
  );
  const [ogImage, setOgImage] = useState<string>(
    initialPattern?.seoMeta?.ogImage || initialPattern?.image || mainImage
  );
  const [canonicalUrl, setCanonicalUrl] = useState<string>(
    initialPattern?.seoMeta?.canonicalUrl || (initialPattern ? `https://welovepattern.com/pattern/${initialPattern.slug}` : '')
  );

  // Pinterest Configuration State (Phase 2 UI + Preview)
  const [pinterestBoardId, setPinterestBoardId] = useState<string>('');
  const [pinterestBoardName, setPinterestBoardName] = useState<string>('');
  const [pinterestTemplateId, setPinterestTemplateId] = useState<PinterestTemplateId>('template-a');
  const [pinterestPreviewUrl, setPinterestPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPin, setIsGeneratingPin] = useState(false);
  const [pinGenerationError, setPinGenerationError] = useState<string | null>(null);

  // Pinterest Boards fetching state
  const [pinterestBoards, setPinterestBoards] = useState<PinterestBoard[]>([]);
  const [isLoadingBoards, setIsLoadingBoards] = useState(false);
  const [boardsError, setBoardsError] = useState<string | null>(null);
  const [isPinterestConnected, setIsPinterestConnected] = useState<boolean | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfAutoFillSuccess, setPdfAutoFillSuccess] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);

  const prevIsOpenRef = useRef(false);
  const prevPatternIdRef = useRef<string | undefined>(undefined);

  // Synchronize form fields only when modal opens or pattern ID changes
  useEffect(() => {
    if (!isOpen) {
      prevIsOpenRef.current = false;
      prevPatternIdRef.current = undefined;
      return;
    }

    const currentPatternId = initialPattern?.id;
    const justOpened = !prevIsOpenRef.current;
    const patternChanged = currentPatternId !== prevPatternIdRef.current;

    // Only reset/initialize state when opening the modal or switching to another pattern
    if (justOpened || patternChanged) {
      prevIsOpenRef.current = true;
      prevPatternIdRef.current = currentPatternId;

      if (initialPattern) {
        setTitle(initialPattern.title || '');
        setSubtitle(initialPattern.subtitle || '');
        setCategory((initialPattern.category as CategoryId) || 'blankets');
        setDifficulty((initialPattern.difficulty as Difficulty) || 'Easy');
        setDescription(initialPattern.description || '');
        setHookSize(initialPattern.hookSize || '5.0 mm (H-8)');
        setYarnWeight(initialPattern.yarnWeight || 'Medium / Worsted (#4)');
        setGauge(initialPattern.gauge || '14 sts and 10 rows = 4 inches (10 cm)');
        setMaterials(
          Array.isArray(initialPattern.materials) && initialPattern.materials.length > 0
            ? initialPattern.materials.join(', ')
            : (typeof initialPattern.materials === 'string' ? initialPattern.materials : 'Worsted Yarn, 5mm Crochet Hook, Tapestry Needle, Scissors')
        );
        setPdfUrl(initialPattern.pdfUrl || '');

        setSteps(
          Array.isArray(initialPattern.steps) && initialPattern.steps.length > 0
            ? initialPattern.steps
            : [
                { rowNumber: 'Row 1', instruction: 'Chain foundation stitches and double crochet across row.' },
                { rowNumber: 'Row 2', instruction: 'Turn work, chain 2, double crochet in each stitch across.' }
              ]
        );

        const defaultImg = initialPattern.image || 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80';
        setMainImage(defaultImg);
        setGallery(
          Array.isArray(initialPattern.gallery) && initialPattern.gallery.length > 0
            ? initialPattern.gallery
            : [defaultImg]
        );

        setMetaTitle(
          initialPattern.seoMeta?.metaTitle || (initialPattern.title ? `${initialPattern.title} - Free Crochet Pattern` : '')
        );
        setMetaDescription(
          initialPattern.seoMeta?.metaDescription || initialPattern.description || ''
        );
        setMetaKeywords(
          initialPattern.seoMeta?.metaKeywords || 'crochet pattern, free crochet pattern, handmade, yarn pattern'
        );
        setOgImage(
          initialPattern.seoMeta?.ogImage || initialPattern.image || defaultImg
        );
        setCanonicalUrl(
          initialPattern.seoMeta?.canonicalUrl || (initialPattern.slug ? `https://welovepattern.com/pattern/${initialPattern.slug}` : '')
        );
      } else {
        // Reset to clean new-pattern defaults
        setTitle('');
        setSubtitle('');
        setCategory('blankets');
        setDifficulty('Easy');
        setDescription('');
        setHookSize('5.0 mm (H-8)');
        setYarnWeight('Medium / Worsted (#4)');
        setGauge('14 sts and 10 rows = 4 inches (10 cm)');
        setMaterials('Worsted Yarn, 5mm Crochet Hook, Tapestry Needle, Scissors');
        setPdfUrl('');
        setSteps([
          { rowNumber: 'Row 1', instruction: 'Chain foundation stitches and double crochet across row.' },
          { rowNumber: 'Row 2', instruction: 'Turn work, chain 2, double crochet in each stitch across.' }
        ]);
        const defaultImg = 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80';
        setMainImage(defaultImg);
        setGallery([defaultImg]);
        setMetaTitle('');
        setMetaDescription('');
        setMetaKeywords('crochet pattern, free crochet pattern, handmade, yarn pattern');
        setOgImage(defaultImg);
        setCanonicalUrl('');
        setPinterestBoardId('');
        setPinterestBoardName('');
        setPinterestTemplateId('template-a');
      }

      if (initialPattern) {
        setPinterestBoardId(initialPattern.pinterestBoardId || '');
        setPinterestBoardName(initialPattern.pinterestBoardName || '');
        setPinterestTemplateId((initialPattern.pinterestTemplateId as PinterestTemplateId) || 'template-a');
      }

      setPinterestPreviewUrl(null);
      setPinGenerationError(null);

      setSavedSuccess(false);
      setIsSaving(false);
      setSaveError(null);
      setIsParsingPdf(false);
      setPdfAutoFillSuccess(null);
      setPdfFileName(null);
      setActiveTab('write');
    }
  }, [initialPattern, isOpen]);

  // Fetch Pinterest Boards for the Pinterest Tab (Phase 2)
  const fetchPinterestBoards = async () => {
    setIsLoadingBoards(true);
    setBoardsError(null);
    try {
      const res = await fetch('/api/admin/pinterest/boards');
      if (!res.ok) {
        if (res.status === 401) {
          setIsPinterestConnected(false);
          setBoardsError('Unauthorized. Admin authentication required.');
          return;
        }
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.boards)) {
        setPinterestBoards(data.boards);
        setIsPinterestConnected(true);
      } else {
        setPinterestBoards([]);
        setIsPinterestConnected(false);
        if (data.error && data.error.includes('not connected')) {
          setBoardsError('Connect your Pinterest account to select a board.');
        } else {
          setBoardsError(data.error || 'Failed to retrieve Pinterest boards.');
        }
      }
    } catch (err: any) {
      console.warn('Error fetching Pinterest boards:', err);
      setBoardsError(err?.message || 'Could not connect to Pinterest boards API.');
      setIsPinterestConnected(false);
    } finally {
      setIsLoadingBoards(false);
    }
  };

  // Trigger board fetch when Pinterest tab is opened
  useEffect(() => {
    if (isOpen && activeTab === 'pinterest' && isPinterestConnected === null && !isLoadingBoards) {
      fetchPinterestBoards();
    }
  }, [isOpen, activeTab, isPinterestConnected, isLoadingBoards]);

  // Preview Pin Generator Handler (calls existing POST /api/admin/patterns/:id/generate-pin)
  const handleGeneratePreviewPin = async () => {
    setIsGeneratingPin(true);
    setPinGenerationError(null);

    try {
      const isDraft = !initialPattern?.id;
      const patternId = initialPattern?.id || 'draft';

      // Effective images from current form state
      const effectiveMainImage = mainImage.trim() || (gallery.length > 0 ? gallery[0] : 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80');
      const effectiveGallery = gallery.filter(g => typeof g === 'string' && g.trim()).length > 0
        ? gallery.filter(g => typeof g === 'string' && g.trim())
        : [effectiveMainImage];

      // Fix 2: Prevent unsaved draft previews from overwriting each other with a unique identifier
      const cleanBaseSlug = title.trim()
        ? title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        : 'draft-pattern';
      const uniqueDraftSlug = `${cleanBaseSlug}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const previewSlug = isDraft ? uniqueDraftSlug : (initialPattern.slug || cleanBaseSlug);

      // Fix 1: Parse current materials state into array
      const parsedMaterials = materials
        .split(',')
        .map(m => m.trim())
        .filter(Boolean);

      const response = await fetch(`/api/admin/patterns/${encodeURIComponent(patternId)}/generate-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          templateId: pinterestTemplateId,
          pattern: {
            id: patternId,
            slug: previewSlug,
            title: title.trim() || 'Crochet Pattern',
            subtitle: subtitle.trim() || `Handcrafted ${difficulty} ${category} crochet project`,
            description: description.trim() || 'Detailed pattern with step-by-step written instructions.',
            difficulty: difficulty,
            image: effectiveMainImage,
            gallery: effectiveGallery,
            category: category,
            tags: [category, difficulty.toLowerCase(), 'free-pattern'],
            materials: parsedMaterials,
            hookSize: hookSize.trim() || '5.0 mm (H-8)',
            pdfUrl: pdfUrl.trim() || undefined,
            isFree: (initialPattern as any)?.isFree !== undefined ? (initialPattern as any).isFree : true,
            price: (initialPattern as any)?.price !== undefined ? (initialPattern as any).price : 0
          }
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate Pinterest preview pin');
      }

      if (data.pinUrl) {
        setPinterestPreviewUrl(`${data.pinUrl}?t=${Date.now()}`);
      } else {
        throw new Error('Server did not return a valid pin URL');
      }
    } catch (err: any) {
      console.error('Error generating pin preview:', err);
      setPinGenerationError(err?.message || 'Failed to generate preview pin');
    } finally {
      setIsGeneratingPin(false);
    }
  };

  if (!isOpen) return null;

  // PDF Upload & Auto-Fill Handler
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingPdf(true);
    setPdfAutoFillSuccess(null);
    setPdfFileName(file.name);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;

        try {
          const response = await fetch('/api/ai/parse-pattern-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pdfBase64: base64Data,
              mimeType: file.type || 'application/pdf',
              fileName: file.name
            })
          });

          let data: any = null;
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          } else {
            const rawText = await response.text();
            console.warn('PDF endpoint returned non-JSON response:', rawText.slice(0, 100));
          }

          if (data && data.success && data.pattern) {
            const p = data.pattern;
            if (p.title) setTitle(p.title);
            if (p.subtitle) setSubtitle(p.subtitle);
            if (p.description) setDescription(p.description);
            if (p.category) setCategory(p.category as CategoryId);
            if (p.difficulty) setDifficulty(p.difficulty as Difficulty);
            if (p.hookSize) setHookSize(p.hookSize);
            if (p.yarnWeight) setYarnWeight(p.yarnWeight);
            if (p.gauge) setGauge(p.gauge);
            if (p.materials) {
              setMaterials(Array.isArray(p.materials) ? p.materials.join(', ') : p.materials);
            }
            if (p.steps && Array.isArray(p.steps) && p.steps.length > 0) {
              setSteps(p.steps);
            }
            if (p.seoTitle) setMetaTitle(p.seoTitle);
            if (p.seoDescription) setMetaDescription(p.seoDescription);
            if (p.seoKeywords) setMetaKeywords(p.seoKeywords);

            setPdfAutoFillSuccess(`✨ Auto-filled pattern fields from "${file.name}"! You can review or edit any detail below.`);
            
            if (p.title) {
              const slug = p.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
              setCanonicalUrl(`https://welovepattern.com/pattern/${slug}`);
            }
          } else {
            // Client-side smart auto-fill fallback if response wasn't JSON or failed
            const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            const formattedTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
            setTitle(formattedTitle);
            setSubtitle(`Crochet pattern extracted from ${file.name}`);
            setMetaTitle(`${formattedTitle} - Free PDF Crochet Pattern`);
            setMetaDescription(`Download free crochet pattern for ${formattedTitle}. Includes step by step rows, hook size, and yarn materials.`);
            setMetaKeywords(`${cleanTitle.toLowerCase()}, free crochet pattern, pdf pattern, handmade crochet`);
            setPdfAutoFillSuccess(`✨ Auto-filled pattern details for "${file.name}"!`);
          }
        } catch (err) {
          console.error('Failed to parse PDF pattern:', err);
          const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          const formattedTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
          setTitle(formattedTitle);
          setPdfAutoFillSuccess(`✨ Auto-filled title from "${file.name}"!`);
        } finally {
          setIsParsingPdf(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('PDF file reader error:', err);
      setIsParsingPdf(false);
    }
  };

  // Image Upload Handlers
const handleFileUpload = async (
  e: React.ChangeEvent<HTMLInputElement>,
  target: 'main' | 'gallery'
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    // Convert image to base64 only temporarily for the upload request.
    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        const base64Data = reader.result as string;

        const response = await fetch('/api/admin/patterns/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            fileData: base64Data
          })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success || !data.url) {
          throw new Error(data.error || 'Failed to upload image');
        }

        const imageUrl = data.url;

        if (target === 'main') {
          setMainImage(imageUrl);

          if (!ogImage || ogImage === mainImage || ogImage.includes('unsplash.com')) {
            setOgImage(imageUrl);
          }
        } else {
          setGallery(prev => {
            const filtered = prev.filter(g => !g.includes('photo-1584992236310-6edddc08acff'));
            return [...filtered, imageUrl];
          });
        }
      } catch (err) {
        console.error('Pattern image upload failed:', err);
        setSaveError(
          err instanceof Error ? err.message : 'Failed to upload image'
        );
      }
    };

    reader.readAsDataURL(file);
  } catch (err) {
    console.error('Pattern image reader error:', err);
    setSaveError('Failed to read image file.');
  } finally {
    // Allow selecting the same file again.
    e.target.value = '';
  }
};

  // Add Step
  const handleAddStep = () => {
    setSteps(prev => [
      ...prev,
      { rowNumber: `Row ${prev.length + 1}`, instruction: 'Chain stitches and repeat sequence across row.' }
    ]);
  };

  // Remove Step
  const handleRemoveStep = (index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index));
  };

  // Auto Generate SEO Meta Tags
  const handleAutoGenerateSEO = () => {
    if (title.trim()) {
      const trimmedTitle = title.trim();
      const autoTitle = `${trimmedTitle} | Free ${difficulty} Crochet Pattern`;
      setMetaTitle(autoTitle);

      const autoDesc = description.trim() 
        ? `${description.trim().slice(0, 150)}... Download free PDF crochet pattern with step-by-step instructions!`
        : `Free ${difficulty} level crochet pattern for ${trimmedTitle}. Includes materials, gauge, stitch guides and downloadable PDF.`;
      setMetaDescription(autoDesc);

      const computedKeywords = `${trimmedTitle.toLowerCase()}, free crochet pattern, ${category} crochet, ${difficulty.toLowerCase()} pattern, ${yarnWeight.toLowerCase()}`;
      setMetaKeywords(computedKeywords);

      const slug = trimmedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `pattern-${Date.now()}`;
      setCanonicalUrl(`https://welovepattern.com/pattern/${slug}`);
      if (!ogImage || ogImage.includes('unsplash.com')) {
        setOgImage(mainImage);
      }
    }
  };

  // Submit & Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setSaveError('Pattern title is required');
      setActiveTab('write');
      return;
    }

    setSaveError(null);
    setIsSaving(true);

    const slug = trimmedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `pattern-${Date.now()}`;

    const effectiveMainImage = mainImage.trim() || (gallery.length > 0 ? gallery[0] : 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80');
    const effectiveGallery = gallery.filter(g => typeof g === 'string' && g.trim()).length > 0
      ? gallery.filter(g => typeof g === 'string' && g.trim())
      : (effectiveMainImage ? [effectiveMainImage] : []);

    const seoMetaObj: SeoMeta = {
      metaTitle: metaTitle.trim() || `${trimmedTitle} - Free Crochet Pattern`,
      metaDescription: metaDescription.trim() || description.trim() || 'Detailed pattern with step-by-step written instructions.',
      metaKeywords: metaKeywords.trim() || 'crochet pattern, free crochet pattern, handmade, yarn pattern',
      ogImage: ogImage.trim() || effectiveMainImage,
      canonicalUrl: canonicalUrl.trim() || `https://welovepattern.com/pattern/${slug}`,
      ogType: 'article',
      structuredDataJson: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        'name': trimmedTitle,
        'description': description.trim() || 'Detailed pattern with step-by-step written instructions.',
        'image': effectiveMainImage,
        'totalTime': 'PT4H',
        'estimatedCost': {
          '@type': 'MonetaryAmount',
          'currency': 'USD',
          'value': '10'
        },
        'tool': [{ '@type': 'HowToTool', 'name': hookSize }],
        'supply': materials.split(',').map(m => ({ '@type': 'HowToSupply', 'name': m.trim() })).filter(s => s.name)
      })
    };

    const patternPayload: any = {
      id: initialPattern?.id || `p-${Date.now()}`,
      slug: slug,
      title: trimmedTitle,
      patternTitle: trimmedTitle,
      subtitle: subtitle.trim() || `Handcrafted ${difficulty} ${category} crochet project`,
      description: description.trim() || 'Detailed pattern with step-by-step written instructions.',
      difficulty: difficulty,
      category: category,
      image: effectiveMainImage,
      coverPhoto: effectiveMainImage,
      coverImage: effectiveMainImage,
      imageUrl: effectiveMainImage,
      photoUrl: effectiveMainImage,
      gallery: effectiveGallery,
      galleryPhotos: effectiveGallery,
      images: effectiveGallery,
      rating: initialPattern?.rating || 5.0,
      reviewCount: initialPattern?.reviewCount || 1,
      downloadsCount: initialPattern?.downloadsCount || 0,
      hookSize: hookSize,
      yarnWeight: yarnWeight,
      yarnMetersNeeded: initialPattern?.yarnMetersNeeded || 450,
      finishedSize: initialPattern?.finishedSize || 'Standard Size',
      estimatedTimeHours: initialPattern?.estimatedTimeHours || 4,
      createdAt: initialPattern?.createdAt || new Date().toISOString().split('T')[0],
      materials: materials.split(',').map(m => m.trim()).filter(Boolean),
      gauge: gauge,
      abbreviationsUsed: ['sc', 'hdc', 'dc', 'ch', 'sl st'],
      steps: steps,
      pdfSize: '1.2 MB',
      pdfPages: 3,
      pdfUrl: pdfUrl.trim() || undefined,
      tags: [category, difficulty.toLowerCase(), 'free-pattern'],
      seoMeta: seoMetaObj,
      pinterestBoardId: pinterestBoardId.trim() || undefined,
      pinterestBoardName: pinterestBoardName.trim() || undefined,
      pinterestTemplateId: pinterestTemplateId || 'template-a'
    };

    try {
      const isEditing = Boolean(initialPattern?.id);
      const endpoint = isEditing ? `/api/admin/patterns/${encodeURIComponent(initialPattern!.id)}` : '/api/admin/patterns';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(patternPayload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save pattern to server.');
      }

      const resData = await res.json();
      const finalPattern: Pattern = resData.pattern || patternPayload;

      // Dynamically apply meta tags immediately to browser DOM head!
      updateHeadMetaTags({
        title: seoMetaObj.metaTitle,
        description: seoMetaObj.metaDescription,
        keywords: seoMetaObj.metaKeywords,
        image: seoMetaObj.ogImage,
        url: seoMetaObj.canonicalUrl
      });

      onSavePattern(finalPattern);
      notifyIndexNowClient({ type: 'pattern', slug: finalPattern.slug });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Error saving pattern to server:', err);
      setSaveError(err.message || 'Failed to persist pattern data.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl border border-slate-200/80 dark:border-slate-800 my-auto overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-xl font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
              <FileText className="w-5 h-5 text-[#E96BA8]" />
              <span>{initialPattern ? 'Edit Pattern & SEO Meta Tags' : 'Write Pattern, Add Photo & SEO Meta'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete details, upload high-res photos, and optimize search engine meta tags
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 px-6 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'write'
                ? 'border-[#E96BA8] text-[#E96BA8]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. Write Details & Steps</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('photo')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'photo'
                ? 'border-[#E96BA8] text-[#E96BA8]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>2. Add & Upload Photos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'seo'
                ? 'border-[#E96BA8] text-[#E96BA8]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Search className="w-4 h-4 text-[#E96BA8]" />
            <span className="flex items-center gap-1">
              <span>3. SEO & Meta Tags</span>
              <span className="px-1.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950 text-[#E96BA8] text-[10px]">Optimized</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pinterest')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'pinterest'
                ? 'border-[#E96BA8] text-[#E96BA8]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Share2 className="w-4 h-4 text-[#E96BA8]" />
            <span>4. Pinterest</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} noValidate className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: WRITE PATTERN */}
          {activeTab === 'write' && (
            <div className="space-y-6">
              
              {/* AI PDF Pattern Auto-Fill Dropzone */}
              <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 dark:from-slate-800 dark:via-purple-950/40 dark:to-slate-800 p-4 sm:p-5 rounded-2xl border-2 border-dashed border-[#E96BA8]/40 dark:border-pink-500/40 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 text-[#E96BA8] shadow-sm shrink-0">
                      <Sparkles className="w-6 h-6 animate-pulse text-[#E96BA8]" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>AI PDF Pattern Auto-Fill</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#E96BA8] text-white text-[10px] font-bold">Smart Auto-Remplir</span>
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        Have a crochet pattern PDF (e.g. hat, blanket, toy)? Upload it here — AI automatically extracts title, hook size, yarn, gauge, materials, row steps &amp; SEO tags!
                      </p>
                    </div>
                  </div>

                  <label className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#E96BA8] hover:bg-pink-600 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-95 shrink-0">
                    {isParsingPdf ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>Analyzing PDF &amp; Auto-filling...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload Pattern PDF</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,application/pdf,text/plain"
                      onChange={handlePdfUpload}
                      disabled={isParsingPdf}
                      className="hidden"
                    />
                  </label>
                </div>

                {pdfAutoFillSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-fadeIn">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{pdfAutoFillSuccess}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Pattern Title <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (saveError) setSaveError(null);
                    }}
                    placeholder="e.g. Sunny Daisy Granny Square Blanket"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#E96BA8] text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryId)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#E96BA8] text-sm"
                  >
                    <option value="blankets">Blankets & Afghans</option>
                    <option value="flowers">Flowers & Appliques</option>
                    <option value="amigurumi">Amigurumi & Toys</option>
                    <option value="bags">Bags & Totes</option>
                    <option value="baby">Baby Items</option>
                    <option value="tops">Summer Tops</option>
                    <option value="sweaters">Sweaters & Cardigans</option>
                    <option value="accessories">Hats & Accessories</option>
                    <option value="home-decor">Home Decor</option>
                    <option value="granny-squares">Granny Squares</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Skill Level</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#E96BA8] text-sm"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Easy">Easy</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pattern Subtitle / Summary</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. A vibrant floral motif perfect for summer home decor"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#E96BA8] text-sm"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Description & Overview</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Write a clear overview of the pattern, styling options, and yarn recommendations..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#E96BA8] text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Hook Size</label>
                  <input
                    type="text"
                    value={hookSize}
                    onChange={(e) => setHookSize(e.target.value)}
                    placeholder="5.0 mm (H-8)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#E96BA8] text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Yarn Weight</label>
                  <input
                    type="text"
                    value={yarnWeight}
                    onChange={(e) => setYarnWeight(e.target.value)}
                    placeholder="Worsted / Medium (#4)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#E96BA8] text-sm"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Materials Needed (Comma Separated)</label>
                  <input
                    type="text"
                    value={materials}
                    onChange={(e) => setMaterials(e.target.value)}
                    placeholder="Cotton Yarn, 5mm Hook, Stitch Markers, Yarn Needle"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#E96BA8] text-sm"
                  />
                </div>

                {/* Direct Free PDF Download URL input */}
                <div className="space-y-1.5 sm:col-span-2 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/5 p-4 rounded-2xl border border-pink-200 dark:border-pink-800/60">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[#E96BA8]">
                      <Download className="w-4 h-4" />
                      <span>Link for Button Download Free PDF Pattern</span>
                    </span>
                    <span className="text-[10px] bg-pink-100 dark:bg-pink-900/60 text-[#E96BA8] dark:text-pink-300 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      <span>Opens in New Tab</span>
                    </span>
                  </label>
                  <input
                    type="url"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    placeholder="put here link for button download free pdf pattern (e.g. https://example.com/pattern.pdf or Google Drive link)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E96BA8] text-sm"
                  />
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Put here link for button download free pdf pattern. When set, users clicking "Get PDF" or "Download Free PDF Pattern" will directly open this link in a new tab.
                  </p>
                </div>
              </div>

              {/* Written Pattern Steps */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Written Row/Round Steps</h3>
                    <p className="text-xs text-slate-500">Add detailed instructions for each row or round</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="px-3 py-1.5 rounded-lg bg-pink-50 text-[#E96BA8] dark:bg-slate-800 text-xs font-bold flex items-center gap-1 hover:bg-pink-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Step</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700">
                      <input
                        type="text"
                        value={step.rowNumber}
                        onChange={(e) => {
                          const updated = [...steps];
                          updated[idx].rowNumber = e.target.value;
                          setSteps(updated);
                        }}
                        className="w-24 px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        placeholder="Row 1"
                      />
                      <textarea
                        rows={2}
                        value={step.instruction}
                        onChange={(e) => {
                          const updated = [...steps];
                          updated[idx].instruction = e.target.value;
                          setSteps(updated);
                        }}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        placeholder="Instructions for this row..."
                      />
                      {steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADD PHOTO */}
          {activeTab === 'photo' && (
            <div className="space-y-6">
              
              {/* Main Cover Image */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Main Cover Photo</span>
                  <span className="text-slate-400 font-normal text-[11px]">Recommended: High-res JPG/PNG (16:9 or 4:3)</span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="relative group rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 aspect-video flex flex-col items-center justify-center p-4 text-center">
                    {mainImage ? (
                      <>
                        <img src={mainImage} alt="Cover preview" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="px-3 py-1.5 bg-white text-slate-900 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-100">
                            Change Photo
                            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'main')} className="hidden" />
                          </label>
                        </div>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-[#E96BA8]" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Click or Drag photo to upload</span>
                        <span className="text-[10px] text-slate-400">PNG, JPG or WebP up to 10MB</span>
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'main')} className="hidden" />
                      </label>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Or enter Photo Image URL</label>
                      <input
                        type="text"
                        value={mainImage}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMainImage(val);
                          if (!ogImage || ogImage === mainImage || ogImage.includes('unsplash.com')) {
                            setOgImage(val);
                          }
                        }}
                        placeholder="https://images.unsplash.com/... or /uploads/patterns/..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#E96BA8]"
                      />
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Your cover photo is automatically used as the default Social Share OpenGraph (<code className="text-pink-500">og:image</code>) preview tag for Pinterest, Facebook, and Twitter cards.
                    </p>
                  </div>
                </div>
              </div>

              {/* Gallery Photos */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Additional Gallery Photos</label>
                  <label className="px-3 py-1.5 bg-pink-50 text-[#E96BA8] hover:bg-pink-100 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Gallery Photo</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'gallery')} className="hidden" />
                  </label>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {gallery.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                      <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setGallery(gallery.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: SEO & META TAGS */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              
              {/* Auto Generate SEO Header */}
              <div className="flex items-center justify-between bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/5 p-4 rounded-2xl border border-pink-200/60 dark:border-slate-700">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#E96BA8] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Search Engine Optimization (SEO)</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Configure meta title, meta description, keywords, and OpenGraph tags to maximize Google & Pinterest ranking
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoGenerateSEO}
                  className="px-3.5 py-2 bg-[#E96BA8] hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Fill SEO Meta</span>
                </button>
              </div>

              {/* SEO Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Meta Title Tag (&lt;title&gt; &amp; og:title)</label>
                    <span className={`text-[11px] font-mono ${metaTitle.length > 60 ? 'text-amber-500' : 'text-slate-400'}`}>
                      {metaTitle.length}/60 chars
                    </span>
                  </div>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="e.g. Daisy Granny Square Blanket - Free Crochet Pattern | WeLovePattern"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#E96BA8]"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Meta Description (&lt;meta name="description"&gt;)</label>
                    <span className={`text-[11px] font-mono ${metaDescription.length > 160 ? 'text-amber-500' : 'text-slate-400'}`}>
                      {metaDescription.length}/160 chars
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Write a catchy 150-character summary that entices Google searchers to click..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#E96BA8]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meta Keywords (&lt;meta name="keywords"&gt;)</label>
                  <input
                    type="text"
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                    placeholder="crochet pattern, daisy blanket, free pdf, granny square"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#E96BA8]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Canonical URL (&lt;link rel="canonical"&gt;)</label>
                  <input
                    type="text"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder="https://welovepattern.com/pattern/my-pattern-slug"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#E96BA8]"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Social OpenGraph Image URL (og:image &amp; twitter:image)</label>
                  <input
                    type="text"
                    value={ogImage}
                    onChange={(e) => setOgImage(e.target.value)}
                    placeholder="https://images.unsplash.com/... or /uploads/patterns/..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#E96BA8]"
                  />
                </div>

              </div>

              {/* LIVE SEO SERP PREVIEW & SOCIAL CARD PREVIEW */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#E96BA8]" />
                  <span>Live Search Engine &amp; Social Card Previews</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Google Search Result Preview */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-sans">
                      <Globe className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-slate-700 dark:text-slate-300">welovepattern.com</span>
                      <span>› pattern › {title ? title.toLowerCase().replace(/\s+/g, '-') : 'pattern-slug'}</span>
                    </div>
                    <h5 className="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer truncate">
                      {metaTitle || (title ? `${title} - Free Crochet Pattern | WeLovePattern` : 'Pattern Title - Free Crochet Pattern')}
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {metaDescription || description || 'Free step-by-step crochet pattern with materials list, gauge, and downloadable PDF.'}
                    </p>
                  </div>

                  {/* Social Share Card Preview (OpenGraph) */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 overflow-hidden shadow-2xs">
                    <div className="aspect-video w-full bg-slate-100 dark:bg-slate-900 relative">
                      <img src={ogImage || mainImage} alt="Social Card" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-100 dark:border-slate-700/50">
                      <span className="text-[10px] uppercase font-bold text-slate-400">WELOVEPATTERN.COM</span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {metaTitle || title || 'Crochet Pattern Title'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {metaDescription || description}
                      </p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 4: PINTEREST PIN CONFIGURATION & PREVIEW */}
          {activeTab === 'pinterest' && (
            <div className="space-y-6">
              
              {/* Pinterest Header & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold shadow-xs">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Pinterest Pin Setup &amp; Preview</span>
                      <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 text-[10px] font-bold">
                        Phase 2 Preview
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Select target Pinterest Board, choose Master Template, and preview the high-res 1024×1536 Pin.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchPinterestBoards}
                    disabled={isLoadingBoards}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBoards ? 'animate-spin text-red-500' : ''}`} />
                    <span>{isLoadingBoards ? 'Loading Boards...' : 'Refresh Boards'}</span>
                  </button>
                </div>
              </div>

              {/* Disconnected State Notification (if Pinterest not connected) */}
              {isPinterestConnected === false && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <p className="font-bold">Connect your Pinterest account to select a board.</p>
                    <p className="text-amber-700 dark:text-amber-300">
                      {boardsError || 'Connect your Pinterest account in the Admin Pinterest tab to retrieve and configure your boards.'}
                    </p>
                  </div>
                </div>
              )}

              {/* 1. Board Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>1. Pinterest Board</span>
                    <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  {pinterestBoards.length > 0 && (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>{pinterestBoards.length} live boards loaded</span>
                    </span>
                  )}
                </div>

                {isLoadingBoards ? (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                    <span>Retrieving boards from Pinterest API...</span>
                  </div>
                ) : (
                  <select
                    value={pinterestBoardId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const matched = pinterestBoards.find(b => b.id === selectedId);
                      if (matched) {
                        setPinterestBoardId(matched.id);
                        setPinterestBoardName(matched.name);
                      } else {
                        setPinterestBoardId('');
                        setPinterestBoardName('');
                      }
                    }}
                    disabled={pinterestBoards.length === 0}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    <option value="">
                      {pinterestBoards.length === 0
                        ? '-- No boards available (Connect Pinterest in Admin) --'
                        : '-- Select a Pinterest Board --'}
                    </option>
                    {pinterestBoards.map((board) => (
                      <option key={board.id} value={board.id}>
                        {board.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Selected Board Details */}
                {pinterestBoardId && (
                  <div className="p-3 bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-fadeIn">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 tracking-wider">Selected Target Board</span>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{pinterestBoardName}</p>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Board ID</span>
                      <p className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 select-all">{pinterestBoardId}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Master Template Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  2. Master Pin Template
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['template-a', 'template-b', 'template-c'] as PinterestTemplateId[]).map((templateId) => {
                    const meta = PINTEREST_TEMPLATES[templateId];
                    const isSelected = pinterestTemplateId === templateId;
                    return (
                      <div
                        key={templateId}
                        onClick={() => setPinterestTemplateId(templateId)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-red-500 bg-red-50/40 dark:bg-red-950/30 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  isSelected
                                    ? 'border-red-600 bg-red-600 text-white'
                                    : 'border-slate-400 bg-white dark:bg-slate-700'
                                }`}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                                {meta.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {meta.tagline}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mt-1">
                            {meta.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>1024 × 1536</span>
                          <span>2:3 Ratio</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Action: Preview Pin Button & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleGeneratePreviewPin}
                    disabled={isGeneratingPin}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isGeneratingPin ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Rendering 1024×1536 Pin...</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>Preview Pin</span>
                      </>
                    )}
                  </button>

                  <span className="text-[11px] text-slate-400">
                    Uses Master {PINTEREST_TEMPLATES[pinterestTemplateId]?.name} renderer
                  </span>
                </div>

                {pinGenerationError && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{pinGenerationError}</span>
                  </div>
                )}
              </div>

              {/* 4. Preview Information Block */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Selected Board:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {pinterestBoardName || <span className="text-slate-400 italic text-xs font-normal">No board selected</span>}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Template:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {PINTEREST_TEMPLATES[pinterestTemplateId]?.name || 'Template A'}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    ({PINTEREST_TEMPLATES[pinterestTemplateId]?.tagline})
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Pinterest Board ID:
                  </span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-xs select-all">
                    {pinterestBoardId || <span className="text-slate-400 italic font-sans font-normal">None</span>}
                  </span>
                </div>
              </div>

              {/* 5. Live 1024×1536 Pinterest Preview Container */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-red-500" />
                    <span>Pinterest Preview (1024 × 1536)</span>
                  </h4>
                  {pinterestPreviewUrl && (
                    <a
                      href={pinterestPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1"
                    >
                      <span>Open Full Size Image</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {isGeneratingPin ? (
                  <div className="aspect-[2/3] max-w-sm mx-auto w-full rounded-2xl bg-slate-100 dark:bg-slate-800/60 border-2 border-dashed border-red-300 dark:border-red-900/50 flex flex-col items-center justify-center p-6 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                    <p className="text-xs font-bold text-slate-800 dark:text-white">
                      Generating High-Res Pinterest Pin...
                    </p>
                    <p className="text-[11px] text-slate-400 text-center max-w-[260px]">
                      Rendering with Master {PINTEREST_TEMPLATES[pinterestTemplateId]?.name} layout, title, badge, and images.
                    </p>
                  </div>
                ) : pinterestPreviewUrl ? (
                  <div className="max-w-sm mx-auto w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 bg-slate-950">
                    <div className="aspect-[2/3] w-full relative">
                      <img
                        src={pinterestPreviewUrl}
                        alt="Pinterest Pin Preview"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[2/3] max-w-sm mx-auto w-full rounded-2xl bg-slate-50 dark:bg-slate-800/40 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-6 text-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center">
                      <Share2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-white">No Pin Preview Generated Yet</p>
                      <p className="text-[11px] text-slate-400 max-w-[240px]">
                        Select your preferred Template above and click &ldquo;Preview Pin&rdquo; to generate the 1024×1536 Pinterest image.
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Save & Apply Banner */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {savedSuccess ? (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Pattern &amp; Meta Tags Saved Successfully!</span>
                </span>
              ) : saveError ? (
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>{saveError}</span>
                </span>
              ) : (
                <span className="text-xs text-slate-500">
                  Saving automatically persists pattern to database and applies SEO tags
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-[#E96BA8] hover:bg-pink-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Pattern &amp; Inject SEO Tags</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
