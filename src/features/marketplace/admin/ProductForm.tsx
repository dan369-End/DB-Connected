import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { generateSlug } from '@/features/academy/admin/utils';
import { ProductImageUploader } from '../components/ProductImageUploader';
import {
  MARKETPLACE_STORAGE_BUCKET,
  buildProductImageStoragePath,
  deleteMarketplaceStorageImage,
} from '../utils/imageStorage';
import type { MarketplaceProduct, MarketplaceCategory, ProductStatus } from '@/types';

interface ProductFormProps {
  product?: MarketplaceProduct | null;
  categories: MarketplaceCategory[];
  onSaveSuccess: (product: MarketplaceProduct) => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  categories,
  onSaveSuccess,
  onCancel,
}) => {
  const { user } = useAuth();

  const [name, setName] = useState(product?.name || '');
  const [slug, setSlug] = useState(product?.slug || (product?.name ? generateSlug(product.name) : ''));
  const [categoryId, setCategoryId] = useState(product?.category_id || '');
  const [shortDescription, setShortDescription] = useState(product?.short_description || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState<number | string>(product?.price ?? '');
  const [currency, setCurrency] = useState(product?.currency || 'XAF');
  const [stockQuantity, setStockQuantity] = useState<number | string>(product?.stock_quantity ?? 0);
  const [status, setStatus] = useState<ProductStatus>((product?.status as ProductStatus) || 'draft');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(Boolean(product?.slug));

  // Current Storage image path or legacy URL
  const [currentImagePath, setCurrentImagePath] = useState<string | null>(product?.image_url || null);

  // Staged local file waiting to be uploaded
  const [stagedImageFile, setStagedImageFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManuallyEdited) {
      setSlug(generateSlug(val));
    }
  };

  /**
   * Save product adhering strictly to requirements:
   * 1. CREATE or UPDATE product in public.marketplace_products first to get product.id
   * 2. If stagedImageFile:
   *    - Upload to marketplace-images bucket at products/{product_id}/{filename}
   *    - Update marketplace_products.image_url with the internal path
   *    - If replacing an old Storage image: delete the old one only after successful upload & DB update
   *    - If DB update fails: attempt to remove newly uploaded orphan file
   */
  const handleSubmit = async (targetStatus?: ProductStatus) => {
    if (!supabase || !user?.id) return;
    const finalStatus = targetStatus || status;

    if (!name.trim()) {
      setErrorMessage('Le nom du produit est obligatoire.');
      return;
    }

    const numStock = Number(stockQuantity);
    if (isNaN(numStock) || numStock < 0) {
      setErrorMessage('La quantité en stock ne peut pas être négative.');
      return;
    }

    const numPrice = price === '' ? null : Number(price);
    if (numPrice !== null && (isNaN(numPrice) || numPrice < 0)) {
      setErrorMessage('Le prix doit être un nombre positif ou nul.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setStatusMessage('Enregistrement des informations produit...');

    const finalSlug = (slug.trim() || generateSlug(name)).toLowerCase();
    const oldImagePath = currentImagePath;

    try {
      let savedProduct: MarketplaceProduct;

      if (product) {
        // UPDATE existing product
        const { data, error } = await supabase
          .from('marketplace_products')
          .update({
            name: name.trim(),
            slug: finalSlug,
            category_id: categoryId || null,
            short_description: shortDescription.trim() || null,
            description: description.trim() || null,
            price: numPrice,
            currency: currency.trim() || 'XAF',
            stock_quantity: numStock,
            image_url: currentImagePath,
            status: finalStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', product.id)
          .select(`
            *,
            marketplace_categories ( id, name )
          `)
          .single();

        if (error) {
          if (error.code === '23505') {
            setErrorMessage('Un produit avec ce slug existe déjà.');
          } else {
            setErrorMessage('Impossible de mettre à jour le produit.');
          }
          return;
        }

        savedProduct = data as MarketplaceProduct;
      } else {
        // CREATE new product (created_by is auth.uid())
        const { data, error } = await supabase
          .from('marketplace_products')
          .insert({
            name: name.trim(),
            slug: finalSlug,
            category_id: categoryId || null,
            short_description: shortDescription.trim() || null,
            description: description.trim() || null,
            price: numPrice,
            currency: currency.trim() || 'XAF',
            stock_quantity: numStock,
            image_url: null,
            status: finalStatus,
            created_by: user.id,
          })
          .select(`
            *,
            marketplace_categories ( id, name )
          `)
          .single();

        if (error) {
          if (error.code === '23505') {
            setErrorMessage('Un produit avec ce slug existe déjà.');
          } else {
            setErrorMessage('Impossible de créer le produit.');
          }
          return;
        }

        savedProduct = data as MarketplaceProduct;
      }

      // Step 2: Handle image upload if a new file is staged
      if (stagedImageFile) {
        setStatusMessage("Importation de l'image dans Supabase Storage...");

        const newStoragePath = buildProductImageStoragePath(
          savedProduct.id,
          stagedImageFile.name
        );

        const { error: uploadError } = await supabase.storage
          .from(MARKETPLACE_STORAGE_BUCKET)
          .upload(newStoragePath, stagedImageFile, {
            upsert: true,
            contentType: stagedImageFile.type || 'image/webp',
          });

        if (uploadError) {
          console.warn('[DB-Connect Marketplace] Image upload error:', uploadError.message);
          alert(
            `Le produit a été enregistré, mais l'image n'a pas pu être téléversée (${uploadError.message}). Vous pourrez la réimporter depuis Modifier.`
          );
        } else {
          // Update product record with the canonical storage path
          setStatusMessage("Mise à jour du lien d'image...");
          const { error: updatePathError } = await supabase
            .from('marketplace_products')
            .update({
              image_url: newStoragePath,
              updated_at: new Date().toISOString(),
            })
            .eq('id', savedProduct.id);

          if (updatePathError) {
            console.warn('[DB-Connect Marketplace] Error updating image_url path:', updatePathError.message);
            // Try to clean up orphan uploaded file
            await deleteMarketplaceStorageImage(newStoragePath);
          } else {
            savedProduct.image_url = newStoragePath;

            // Only delete previous image if replacing succeeded
            if (oldImagePath && oldImagePath !== newStoragePath) {
              await deleteMarketplaceStorageImage(oldImagePath);
            }
          }
        }
      }

      onSaveSuccess(savedProduct);
    } catch (err) {
      console.warn('[DB-Connect Marketplace] Product save exception:', err);
      setErrorMessage('Une erreur inattendue est survenue.');
    } finally {
      setSaving(false);
      setStatusMessage(null);
    }
  };

  return (
    <div className="course-form-card">
      <div className="form-card-header">
        <div>
          <h3 className="form-card-title">
            {product ? 'Éditer le produit' : 'Nouveau produit Marketplace'}
          </h3>
          <p className="form-card-sub">
            {product
              ? `Modification de « ${product.name} »`
              : 'Renseignez les détails du produit pour le catalogue.'}
          </p>
        </div>
        <div className="header-status-indicator">
          <span className="status-indicator-label">Statut actuel :</span>
          <span className={`status-badge status-${product?.status || 'draft'}`}>
            {product?.status === 'published'
              ? 'Publié'
              : product?.status === 'archived'
              ? 'Archivé'
              : 'Brouillon'}
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="auth-alert alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="admin-form"
      >
        <div className="form-grid-2col">
          <div className="form-group">
            <label className="form-label" htmlFor="prod-name">
              Nom du produit *
            </label>
            <input
              id="prod-name"
              type="text"
              required
              className="form-input"
              placeholder="Ex : Ordinateur Portable Pro, Routeur WiFi 6..."
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="prod-slug">
              Slug URL
            </label>
            <input
              id="prod-slug"
              type="text"
              className="form-input font-mono"
              placeholder="ex : ordinateur-portable-pro"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setIsSlugManuallyEdited(true);
              }}
              disabled={saving}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="prod-cat">
            Catégorie de rattachement
          </label>
          <select
            id="prod-cat"
            className="form-input"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={saving}
          >
            <option value="">-- Aucune catégorie --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Product Image Uploader Section (Storage private bucket) */}
        <ProductImageUploader
          productId={product?.id}
          existingImagePath={currentImagePath}
          selectedFile={stagedImageFile}
          onFileSelect={(file) => setStagedImageFile(file)}
          onExistingImageRemoved={() => {
            setCurrentImagePath(null);
            if (product) product.image_url = null;
          }}
          disabled={saving}
        />

        <div className="form-grid-3col">
          <div className="form-group">
            <label className="form-label" htmlFor="prod-price">
              Prix (en FCFA / XAF)
            </label>
            <input
              id="prod-price"
              type="number"
              min={0}
              step={100}
              className="form-input"
              placeholder="Ex : 25000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="prod-currency">
              Devise
            </label>
            <select
              id="prod-currency"
              className="form-input"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={saving}
            >
              <option value="XAF">XAF (FCFA)</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="prod-stock">
              Quantité en stock *
            </label>
            <input
              id="prod-stock"
              type="number"
              min={0}
              required
              className="form-input"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              disabled={saving}
            />
            <span className="form-hint">
              {Number(stockQuantity) === 0
                ? 'Rupture de stock'
                : Number(stockQuantity) <= 5
                ? 'Stock limité'
                : 'En stock'}
            </span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="prod-short-desc">
            Description courte (affichée sur la carte)
          </label>
          <input
            id="prod-short-desc"
            type="text"
            className="form-input"
            placeholder="Aperçu des caractéristiques principales..."
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="prod-desc">
            Description détaillée
          </label>
          <textarea
            id="prod-desc"
            rows={5}
            className="form-input"
            placeholder="Spécifications techniques complètes, conditions de garantie..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="prod-status">
            Statut de publication
          </label>
          <select
            id="prod-status"
            className="form-input"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProductStatus)}
            disabled={saving}
          >
            <option value="draft">Brouillon (non visible des utilisateurs)</option>
            <option value="published">Publié (visible dans le catalogue)</option>
            <option value="archived">Archivé (retiré de la vente)</option>
          </select>
        </div>

        {statusMessage && (
          <div className="upload-progress-status">
            <div className="spinner"></div>
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="course-form-actions-bar">
          <button
            type="button"
            className="btn-admin-cta secondary"
            onClick={onCancel}
            disabled={saving}
          >
            Annuler
          </button>

          <div className="right-action-cluster">
            {product && (
              <>
                {status !== 'draft' && (
                  <button
                    type="button"
                    className="btn-admin-cta outline-warning"
                    onClick={() => handleSubmit('draft')}
                    disabled={saving}
                  >
                    Mettre en brouillon
                  </button>
                )}
                {status !== 'published' && (
                  <button
                    type="button"
                    className="btn-admin-cta outline-success"
                    onClick={() => handleSubmit('published')}
                    disabled={saving}
                  >
                    Publier le produit
                  </button>
                )}
                {status !== 'archived' && (
                  <button
                    type="button"
                    className="btn-admin-cta outline-muted"
                    onClick={() => handleSubmit('archived')}
                    disabled={saving}
                  >
                    Archiver
                  </button>
                )}
              </>
            )}

            <button
              type="submit"
              className="btn-admin-cta primary"
              disabled={saving}
            >
              {saving ? (
                <span className="btn-loading-content">
                  <span className="spinner"></span> {statusMessage || 'Enregistrement...'}
                </span>
              ) : (
                'Enregistrer'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
