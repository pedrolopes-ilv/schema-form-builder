# 🧩 Form Schema Builder

A form builder and renderer system that allows you to visually design forms, generate a portable JSON schema, and render those forms consistently in any web application.

The goal of this project is to separate form design, form rendering, and form data consumption, enabling predictable integrations and reusable forms across different platforms.

## ✨ Features

### 🖱 Drag & Drop Form Builder

- Create forms visually
- Reorder fields and blocks easily
- No manual JSON editing required

### 📱 Responsive Layout System

- Define layouts per breakpoint (desktop, tablet, mobile)
- Renderer adapts to the host application’s UI system

### ⚙️ Simple & Predictable Configuration

- Clear field definitions
- Stable, versioned JSON schema
- Easy to store, share, and version-control

### 🔀 Dynamic / Conditional Blocks

- Show or hide fields and blocks based on other field values
- Declarative condition rules (no embedded code)

### 📤 Clean JSON Output

- Emits form values as a simple key-value JSON object
- Output keys are configurable for predictable API responses
- Ideal for backend integrations and workflows

### 🧩 Renderer-Agnostic

The same schema can be rendered in React, Vue, Angular, or plain JS

Thin renderer adapters on top of a shared core

## 🧠 Concept

This project is built around three layers:

Form Builder  →  JSON Schema  →  Renderer

### Form Builder
- Visual tool for creating and configuring forms.

### JSON Schema
A framework-agnostic contract that describes:

- Fields
- Layout
- Validation
- Conditional logic
- Output mapping

### Renderer
Consumes the schema and:

- Renders the form UI
- Evaluates conditions
- Emits form values as JSON

## 📦 Schema Overview
Basic example
{
"version": "1.0",
"meta": {
"id": "user-profile",
"title": "User Profile"
},
"fields": [
{
"id": "email",
"type": "text",
"label": "Email",
"required": true,
"outputKey": "email"
}
]
}

## 🧱 Field Definition

Each field is self-contained and predictable:

{
"id": "firstName",
"type": "text",
"label": "First name",
"defaultValue": "",
"validation": {
"required": true,
"minLength": 2
},
"layout": {
"colSpan": {
"desktop": 6,
"tablet": 8,
"mobile": 12
}
},
"outputKey": "first_name"
}

## 🔀 Conditional Logic

Conditions are declarative and evaluated at runtime.

{
"if": {
"field": "accountType",
"operator": "equals",
"value": "company"
},
"then": {
"action": "show",
"targets": ["companyName", "companyVat"]
},
"else": {
"action": "hide",
"targets": ["companyName", "companyVat"]
}
}


## Supported operators include:

- equals
- notEquals
- contains
- greaterThan
- lessThan
- isEmpty
- isNotEmpty

## 📤 Output Format

The renderer emits a simple JSON map, ready for APIs or storage:

{
"email": "john@doe.com",
"first_name": "John",
"last_name": "Doe"
}


Output keys are explicitly defined in the schema to guarantee stable and predictable responses.

## 🚀 Use Cases

- Internal admin panels
- Dynamic onboarding flows
- Configuration-driven UIs
- Multi-tenant SaaS forms
- Headless form systems
- Low-code / no-code platforms

## 🛠 Extensibility

The system is designed to grow:

- Add new field types without breaking existing schemas
- Introduce new condition operators
- Support nested or transformed output mappings
- Maintain backward compatibility via schema versioning

## 📐 Design Principles

Schema-first

Framework-agnostic

Predictable output

No business logic in the UI

Separation of concerns

## 🧪 Project Status

🚧 Work in progress

Planned milestones:

- Schema specification
- Core renderer
- Conditional logic engine
- Builder UI
- Framework adapters

## 🤝 Contributing

Contributions are welcome!

Propose schema improvements

Add new field types

Improve renderer adapters

Report bugs or edge cases

Please open an issue or submit a pull request.

## 📄 License

MIT License © Your Name / Your Organization
