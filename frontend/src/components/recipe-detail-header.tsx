import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Recipe, RecipeEditableField, RecipeEditableValue } from '../types';
import { getTotalKcal } from '../utils/nutrients';

interface InlineFieldProps {
  value: RecipeEditableValue;
  placeholder: string;
  ariaLabel: string;
  onSave: (value: string) => Promise<void>;
  displayValue?: string;
  inputType?: 'text' | 'number';
  className?: string;
}

const draftFromValue = (value: RecipeEditableValue) => (value === null ? '' : String(value));

export function InlineField({
  value,
  placeholder,
  ariaLabel,
  onSave,
  displayValue,
  inputType = 'text',
  className = '',
}: InlineFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(draftFromValue(value));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isCommittingRef = useRef(false);

  useEffect(() => {
    if (!isEditing) {
      setDraft(draftFromValue(value));
    }
  }, [isEditing, value]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const startEditing = () => {
    setError(null);
    setDraft(draftFromValue(value));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft(draftFromValue(value));
    setError(null);
    setIsEditing(false);
  };

  const commitDraft = async () => {
    if (isCommittingRef.current) {
      return;
    }

    isCommittingRef.current = true;
    setIsSaving(true);
    setError(null);

    try {
      await onSave(draft);
      setIsEditing(false);
    } catch (err) {
      setDraft(draftFromValue(value));
      setError(err instanceof Error ? err.message : 'Unable to save this field.');
      setIsEditing(false);
    } finally {
      isCommittingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void commitDraft();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditing();
    }
  };

  const isEmpty = value === null || value === '';
  const renderedValue = isEmpty ? placeholder : displayValue ?? String(value);

  return (
    <span className={`inline-field-wrapper ${className}`.trim()}>
      {isEditing ? (
        <input
          ref={inputRef}
          type={inputType}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => void commitDraft()}
          onKeyDown={handleInputKeyDown}
          disabled={isSaving}
          className="inline-field-input"
          aria-label={ariaLabel}
          autoComplete="off"
          min={inputType === 'number' ? 1 : undefined}
        />
      ) : (
        <button
          type="button"
          onClick={startEditing}
          className={`inline-field ${isEmpty ? 'inline-field--empty' : ''}`.trim()}
          aria-label={`${ariaLabel}: ${renderedValue}`}
        >
          {renderedValue}
        </button>
      )}
      {error && <span className="inline-field-error">{error}</span>}
    </span>
  );
}

interface RecipeDetailHeaderProps {
  recipe: Recipe;
  onBack: () => void;
  onFieldSave: (field: RecipeEditableField, value: RecipeEditableValue) => Promise<void>;
}

export function RecipeDetailHeader({ recipe, onBack, onFieldSave }: RecipeDetailHeaderProps) {
  const totalKcal = getTotalKcal(recipe.nutrients ?? []);

  return (
    <>
      <div className="recipe-detail-header">
        <h2>
          <InlineField
            value={recipe.name}
            placeholder="Untitled recipe"
            ariaLabel="Recipe name"
            onSave={(value) => onFieldSave('name', value)}
            className="recipe-title-inline"
          />
        </h2>
        <button onClick={onBack} className="back-button">
          Back to Recipes
        </button>
      </div>

      {(totalKcal !== null || recipe.calorie_density !== null) && (
        <div className="recipe-stats-block">
          {totalKcal !== null && (
            <div className="stat-item">
              <span className="stat-value">{Math.round(totalKcal)}</span>
              <span className="stat-label">kcal total</span>
            </div>
          )}
          {recipe.calorie_density !== null && recipe.calorie_density !== undefined && (
            <div className="stat-item">
              <span className="stat-value">{recipe.calorie_density.toFixed(1)}</span>
              <span className="stat-label">kcal/g</span>
            </div>
          )}
        </div>
      )}

      <div className="recipe-metadata-panel">
        <InlineField
          value={recipe.description}
          placeholder="Add a description"
          ariaLabel="Recipe description"
          onSave={(value) => onFieldSave('description', value)}
          className="recipe-description-inline"
        />
        <div className="recipe-meta-row">
          <InlineField
            value={recipe.servings}
            placeholder="Add servings"
            ariaLabel="Recipe servings"
            onSave={(value) => onFieldSave('servings', value)}
            displayValue={recipe.servings !== null ? `Serves ${recipe.servings}` : undefined}
            inputType="number"
            className="recipe-meta-pill"
          />
          <InlineField
            value={recipe.total_time_minutes}
            placeholder="Add time"
            ariaLabel="Recipe total time"
            onSave={(value) => onFieldSave('total_time_minutes', value)}
            displayValue={recipe.total_time_minutes !== null ? `${recipe.total_time_minutes} min` : undefined}
            inputType="number"
            className="recipe-meta-pill"
          />
        </div>
      </div>
    </>
  );
}
