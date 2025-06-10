# FlexTime UI Components

A comprehensive collection of reusable UI components built with TypeScript, React, and Tailwind CSS, featuring glassmorphic design elements and consistent styling patterns.

## Overview

This UI component library provides:
- **Glassmorphic Effects**: Backdrop blur and transparency for modern aesthetics
- **TypeScript Support**: Full type safety with comprehensive interfaces
- **Consistent Design**: Unified styling following FlexTime design system
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support
- **Responsive Design**: Mobile-first approach with breakpoint considerations
- **Theme Support**: Light/dark theme compatibility

## Components

### Form Input Components

#### FTInput
Advanced input component with glassmorphic styling, validation, and icon support.

```tsx
import { FTInput } from '@/components/ui';

<FTInput
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  icon={<Mail size={16} />}
  variant="glass"
  required
  error={errors.email}
  helperText="We'll never share your email"
/>
```

**Props:**
- `variant`: `'default' | 'glass' | 'minimal'`
- `size`: `'sm' | 'md' | 'lg'`
- `type`: Standard HTML input types plus `'search'`
- `icon`: React node for left icon
- `error`: Error message string
- `success`: Boolean for success state
- `loading`: Boolean for loading state

#### FTSelect
Dropdown select component with consistent styling.

```tsx
import { FTSelect } from '@/components/ui';

<FTSelect
  label="Sport"
  options={[
    { value: 'basketball', label: 'Basketball' },
    { value: 'football', label: 'Football' },
    { value: 'baseball', label: 'Baseball' }
  ]}
  placeholder="Select a sport"
  variant="glass"
/>
```

#### FTTextarea
Multi-line text input with auto-resize capabilities.

```tsx
import { FTTextarea } from '@/components/ui';

<FTTextarea
  label="Description"
  placeholder="Enter description..."
  autoResize
  minRows={3}
  maxRows={8}
  variant="glass"
/>
```

### Button Components

#### FTButton
Versatile button component with multiple variants and loading states.

```tsx
import { FTButton } from '@/components/ui';

<FTButton
  variant="primary"
  size="lg"
  loading={isSubmitting}
  leftIcon={<Save size={16} />}
  glowEffect
>
  Save Changes
</FTButton>
```

**Variants:**
- `primary`: Blue gradient with hover effects
- `secondary`: Gray gradient for secondary actions
- `ghost`: Transparent with hover background
- `glass`: Glassmorphic with backdrop blur
- `outline`: Bordered button that fills on hover
- `danger`: Red gradient for destructive actions

### Card Components

#### FTCard
Flexible card container with glassmorphic styling options.

```tsx
import { FTCard, FTCardHeader, FTCardContent, FTCardFooter } from '@/components/ui';

<FTCard variant="glass" size="lg" hover glow>
  <FTCardHeader
    title="Schedule Overview"
    subtitle="Current season statistics"
    action={<EditButton />}
  />
  <FTCardContent>
    Card content goes here...
  </FTCardContent>
  <FTCardFooter>
    Footer actions...
  </FTCardFooter>
</FTCard>
```

### Modal Components

#### FTModal
Full-featured modal with backdrop blur and accessibility features.

```tsx
import { FTModal, FTModalHeader, FTModalContent, FTModalFooter } from '@/components/ui';

<FTModal
  isOpen={isOpen}
  onClose={onClose}
  size="lg"
  variant="glass"
  title="Edit Schedule"
  subtitle="Modify game details"
>
  <FTModalContent>
    Modal content...
  </FTModalContent>
</FTModal>
```

#### FTConfirmModal
Pre-built confirmation dialog for common actions.

```tsx
import { FTConfirmModal } from '@/components/ui';

<FTConfirmModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Schedule"
  message="Are you sure you want to delete this schedule? This action cannot be undone."
  variant="danger"
/>
```

### Form Components

#### FTForm
Complete form management with validation and state handling.

```tsx
import { FTForm, FTFormGroup, FTFormSection } from '@/components/ui';

<FTForm
  initialValues={{ name: '', email: '' }}
  validationSchema={{
    name: { required: true, min: 2 },
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
  }}
  onSubmit={handleSubmit}
  variant="glass"
>
  <FTFormGroup title="Personal Information">
    <FTFormSection columns={2}>
      <FTInput name="name" label="Full Name" />
      <FTInput name="email" label="Email" type="email" />
    </FTFormSection>
  </FTFormGroup>
</FTForm>
```

## Design System Integration

### CSS Variables
Components use CSS variables defined in `flextime-variables.css`:

```css
:root {
  --primary: #0066cc;
  --accent: #00c2ff;
  --background: #f8f9fa;
  --card-bg: #ffffff;
  --transition-medium: all 0.3s ease;
  /* ... more variables */
}
```

### Glassmorphic Effects
All components support glassmorphic styling with:
- Backdrop blur filters
- Semi-transparent backgrounds
- Subtle border highlights
- Smooth transitions

### Responsive Design
Components are mobile-first with responsive breakpoints:
- `sm`: 640px and up
- `md`: 768px and up
- `lg`: 1024px and up
- `xl`: 1280px and up

## Usage Examples

### Complete Form Example

```tsx
import React, { useState } from 'react';
import {
  FTForm,
  FTFormGroup,
  FTFormSection,
  FTInput,
  FTSelect,
  FTTextarea,
  FTButton
} from '@/components/ui';

const GameScheduleForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      await api.createGame(values);
      // Handle success
    } catch (error) {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FTForm
      initialValues={{
        homeTeam: '',
        awayTeam: '',
        venue: '',
        date: '',
        time: '',
        notes: ''
      }}
      validationSchema={{
        homeTeam: { required: true },
        awayTeam: { required: true },
        venue: { required: true },
        date: { required: true },
        time: { required: true }
      }}
      onSubmit={handleSubmit}
      variant="glass"
    >
      <FTFormGroup title="Game Details">
        <FTFormSection columns={2}>
          <FTSelect
            name="homeTeam"
            label="Home Team"
            options={teamOptions}
            placeholder="Select home team"
          />
          <FTSelect
            name="awayTeam"
            label="Away Team"
            options={teamOptions}
            placeholder="Select away team"
          />
        </FTFormSection>
        
        <FTFormSection columns={3}>
          <FTSelect
            name="venue"
            label="Venue"
            options={venueOptions}
            placeholder="Select venue"
          />
          <FTInput
            name="date"
            label="Date"
            type="date"
          />
          <FTInput
            name="time"
            label="Time"
            type="time"
          />
        </FTFormSection>
      </FTFormGroup>

      <FTFormGroup title="Additional Information">
        <FTTextarea
          name="notes"
          label="Notes"
          placeholder="Any additional notes..."
          autoResize
          minRows={3}
        />
      </FTFormGroup>
    </FTForm>
  );
};
```

### Dashboard Card Grid

```tsx
import React from 'react';
import { FTCard, FTCardHeader, FTCardContent } from '@/components/ui';

const DashboardCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <FTCard variant="glass" hover glow>
        <FTCardHeader
          title="Total Games"
          subtitle="This season"
        />
        <FTCardContent>
          <div className="text-3xl font-bold text-blue-600">248</div>
        </FTCardContent>
      </FTCard>

      <FTCard variant="glass" hover glow>
        <FTCardHeader
          title="Conflicts"
          subtitle="Requiring resolution"
        />
        <FTCardContent>
          <div className="text-3xl font-bold text-red-500">12</div>
        </FTCardContent>
      </FTCard>

      <FTCard variant="glass" hover glow>
        <FTCardHeader
          title="Optimization"
          subtitle="Current efficiency"
        />
        <FTCardContent>
          <div className="text-3xl font-bold text-green-500">94%</div>
        </FTCardContent>
      </FTCard>
    </div>
  );
};
```

## Best Practices

1. **Consistent Variants**: Use `glass` variant for modern glassmorphic look
2. **Form Validation**: Always provide validation schema for forms
3. **Loading States**: Include loading states for async operations
4. **Accessibility**: Use proper labels and ARIA attributes
5. **Error Handling**: Provide clear error messages and states
6. **Responsive Design**: Test components across different screen sizes
7. **Performance**: Use React.memo for complex components when needed

## Development

### Adding New Components
1. Create component file in `/components/ui/`
2. Export from `index.ts`
3. Follow existing naming conventions (`FT` prefix)
4. Include TypeScript interfaces
5. Add documentation and examples

### Styling Guidelines
- Use Tailwind CSS classes
- Follow existing color patterns
- Implement glassmorphic effects consistently
- Ensure dark mode compatibility
- Test responsive behavior

This UI component library provides a solid foundation for building consistent, beautiful, and functional interfaces throughout the FlexTime application.