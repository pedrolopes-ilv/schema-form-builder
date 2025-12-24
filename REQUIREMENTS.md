# ⚙️ Form Builder Application Requirements (Vue 3 / Pinia / Vitest)

This document specifies the definitive technical stack and requirements for the LLM to generate the Form Builder application.

---

## 1. Architectural & Technical Requirements

| ID | Requirement | Detail/Constraint |
| :--- | :--- | :--- |
| **TECH-1** | **Frontend Framework** | **Vue 3** (Composition API) must be used for all component development. |
| **TECH-2** | **State Management** | **Pinia** must be used for all application state management (e.g., storing the form schema, field palette, and field configurations). |
| **TECH-3** | **Styling** | Exclusively use **Tailwind CSS** for all component styling and layout. Avoid custom CSS files. |
| **TECH-4** | **Component Libraries** | Use minimal, unstyled, and accessible component primitives (e.g., **Headless UI** for Vue, or **Radix Vue**) to handle complex elements (dropdowns, modals, etc.). |
| **TECH-5** | **Unit Testing** | **Vitest** must be set up and used to write unit tests for the Pinia store actions/getters and critical component logic. |
| **TECH-6** | **Responsiveness** | All components must be fully responsive, utilizing Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`). |
| **TECH-7** | **Drag-and-Drop** | Implement drag-and-drop functionality using a dedicated library compatible with Vue 3 (e.g., `vuedraggable` or similar). |

## 2. Functional Requirements

| ID | Feature | Description |
| :--- | :--- | :--- |
| **FUNC-1** | **Form Creation Interface** | A central canvas area where the user drops and manages form fields. |
| **FUNC-2** | **Field Palette** | A sidebar or panel listing available field types for drag-and-drop. |
| **FUNC-3** | **Core Field Types** | Must include: **Text Input**, **Textarea**, **Number Input**, **Checkbox**, **Radio Group**, **Dropdown (Select)**, and **Date Picker**. |
| **FUNC-4** | **Configuration Panel** | Clicking on a field must open a panel to configure its properties (label, placeholder, required status, options, etc.). Changes must update the Pinia state. |
| **FUNC-5** | **Field Management** | Allow users to reorder fields and delete fields from the form canvas. |
| **FUNC-6** | **JSON Schema Output** | Provide a mechanism to generate and display the final form structure as a JSON schema object, retrieved directly from the Pinia store state. |

## 3. Data Model Requirements (JSON Schema)

The application state (managed by Pinia) must define and hold the entire form structure as a single JSON object. This structure must be based on the following minimal schema:

```json
{
  "formTitle": "string",
  "fields": [
    {
      "id": "string",       // Unique ID for the field (used as key)
      "type": "string",     // Field type (e.g., 'text', 'checkbox', 'select')
      "label": "string",    // User-facing label
      "placeholder": "string", // Placeholder text (optional)
      "required": "boolean", // Required status
      "validation": "object", // Object for validation rules (optional)
      // Type-Specific Properties (e.g., for 'select' or 'radio')
      "options": [
        {"value": "string", "label": "string"}
      ]
    }
    // ... more field objects
  ]
}
```

## 4. LLM Action Plan
The LLM must structure its code generation around the following steps:

Project Setup: Initialize a standard Vue 3 project with Pinia, Tailwind CSS, and Vitest configured.

Schema Definition: Define the TypeScript interfaces/types for the JSON schema fields.

Pinia Store: Create a Pinia store (useFormBuilderStore) with state management logic (actions for addField, updateField, deleteField) and getters (e.g., jsonSchemaOutput).

Core Components: Create the generic FormFieldWrapper.vue and individual, Tailwind-styled components for each field type in FUNC-3.

Builder Logic: Implement the Drag-and-Drop system, connecting user actions directly to the Pinia state management actions.

Testing (TECH-5): Provide example Vitest unit tests for the Pinia store actions to verify state mutations.