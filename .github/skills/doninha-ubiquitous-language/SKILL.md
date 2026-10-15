---
name: 'doninha-ubiquitous-language'
description: 'Resolves what the code is allowed to be CALLED before any of it is written: which language domain identifiers use, and which term names each business concept. The project codebase always outranks this skill — read its real naming pattern first and follow it, even when it contradicts every default here; this skill only supplies the naming discipline the project has not already decided, and when the codebase has no clear pattern (or two competing ones) the answer is ASKED, never assumed. Use it BEFORE naming or writing a class, function, variable, endpoint, table, column or event; when drafting a technical spec or task that introduces domain terms; when reviewing naming; and whenever a business term has to be turned into an identifier. Triggers on: naming, nomenclature, ubiquitous language, glossary, domain terms, what should this be called, which language for identifiers, entity/field/method naming, rename.'
---

# Doninha Ubiquitous Language

Two questions, and this skill exists to answer both **before** code is written, not after:

1. **Which language do identifiers speak?** (the codebase decides — see §0)
2. **Which term names each business concept?** (one stable name, shared by business and code)

Naming resolved after the fact is a rename, and renames are the change nobody schedules. Load this
skill while the technical decisions are being made — the spec stage — not at review time.

## 0. Precedence — the codebase decides, this skill is the fallback

**This is the first rule, and it overrides everything below it.**

| Order | Authority | What it means |
| --- | --- | --- |
| 1 | **The project's real code and its own `conventions.md`** | If the project names things in Portuguese, name things in Portuguese. If it uses `snake_case` for methods, use `snake_case`. Follow it even where it contradicts every default in this file. |
| 2 | **`DONINHA.md` team policy**, when it states a naming or language rule | A deliberate team override of the defaults below. |
| 3 | **The defaults in this file** | Only when 1 and 2 are silent. |

A convention that is already live in the code is a decision the team made and is paying for.
Overriding it produces a codebase that speaks two languages — which is strictly worse than either
language chosen consistently, because now every reader has to know which half they are in.

### How to resolve it

1. Read `.doninha/docs/codebase/conventions.md` and the real code of the module being touched.
2. **One clear pattern** → follow it. Record it as a decision with its evidence (`file:line`).
   Do not ask; there is nothing open.
3. **No pattern** (greenfield, or nothing comparable exists yet) → **ask**, offering the defaults
   below as the recommended option.
4. **Two or more competing patterns** and nothing says which is current → **ask**, showing each
   one with its `file:line`. Never pick by preference, and never pick "the one this skill likes".

In `doninha-desenvolver` that question belongs to the technical-doubt gate
(`steps/step-03-spec-e-tasks.md` §4), which asks it in one batch before the spec is written and
records the answer in `spec.md`'s **Decisões técnicas**. From that point the contract is settled:
implementation follows it, and review measures against it.

**A mixed codebase is not a licence to add a third way.** When the two patterns split cleanly by
module, follow the one of the module you are touching, and say so.

Utilize this skill when defining terms, concepts, entities, actions, and other elements of the
project's domain, ensuring that they are clear, consistent, and understood by all team members.

## Principles of Ubiquitous Language

    1. All important business terms should have a unique, stable name that is shared between product, business, and engineering.

    2. If a business term does not exist in the code, the model is wrong.

    3. If the code uses terms that the business does not recognize, the nomenclature used in the code and in the model is wrong.

    4. The code should use the same terms as the business, and the business should use the same terms as the code — one concept, one name, everywhere: architecture documents, source code, database tables and documentation all map to it.

    5. **Which language that shared name is written in is a project-level decision, not a principle.** In a project that translates, "Pedido de Venda" becomes `Order` and the mapping is documented. In a project whose code speaks the business's own language, it stays `PedidoDeVenda` — and that is equally correct ubiquitous language, because the point of the principle is that business and code say *the same thing*, not that they say it in English. §0 decides which of the two this project is.

## Doninha default for Ubiquitous Language

**Applies only when §0 left the question open** — a greenfield project, or one whose codebase has
no clear pattern and whose team chose this default when asked.

- The domain speaks English in the code (classes, methods, variables, etc).

This is a default, not a contract. In a project that already names its domain in another language,
the rule above is **wrong for that project** and §0 wins. Everything that follows — the translation
table, the casing conventions — is the same kind of default: useful where nothing was decided,
overridden wherever the codebase already decided.

## Examples of translating business terms to ubiquitous language

_Illustrative, and English-default. In a project whose domain speaks Portuguese, the right-hand column is the business term itself — the discipline that survives is "one stable name per concept", not the translation._

| Business Term | Ubiquitous Language Term | Justification |
| --- | --- | --- |
| Cliente | Customer | Avoid "client" to prevent confusion with "client" in the software context. |
| Pedido de Venda | Order | "Order" is the most common and recognized term to represent a sales order in English. |
| Fatura | Invoice | "Invoice" is the most common and recognized term to represent an invoice in English. |
| Produto | Product | "Product" is the most common and recognized term to represent a product in English. |
| Categoria de Produto | ProductCategory | "ProductCategory" is a clear and specific term to represent a product category. |
| Vencimento do Pedido | OrderDueDate | "OrderDueDate" is a clear and specific term to represent the due date of an order. |

## Naming Conventions for Ubiquitous Language

### Entities (Core Business Concepts)

- Always singular.
- Compound names
- Pascal Case (ex: Product, Customer, OrderItem).

### Aggregates (Grouping of related entities)

- Always singular.
- Pascal_Case + Snake_Case
- Ex: Order_Item, FreightContract, Product_Catalog.

### Attributes

- Always singular.
- Do not use prefixes.
- PascalCase
- Ex: FreightCharge, RoomNumber...

### Methods, Functions, and Services

- Verb + Object
- PascalCase
- Ex: PlaceOrder, CalculateFreightCharge, GetCustomerById.

### Business Events

- Verb in past tense + Object
- PascalCase
- Ex: OrderPlaced, CustomerRegistered, ProductOutOfStock.

### REST APIs

- Noun in plural for resources (ex: /customers, /orders).
- Kebab-case
- Examples: GET /api/orders/pending-payments, POST /api/order-items

### Variables

- camelCase
- Ex: orderTotal, customerName, productPrice.

## Checklist to ensure the consistency of the ubiquitous language

The first item is the one that fails most often, and it is not on the list below because it comes
before the list: **the project's own pattern was read and followed** (§0). A checklist applied
against the wrong authority produces confident, consistent, wrong names.


- [ ] Avoid including data types or technical information in the nomenclature, except if there is a well-defined strategy in the business context.
- [ ] Avoid abbreviations, whenever possible, only use abbreviations that are common in the business context. Example: SKU, API, ID...
- [ ] A term with two different names, if "OrderDueDate" exists, do not create "DueAt" elsewhere.
- [ ] Avoid synonyms for business terms.
- [ ] Avoid creating names with technical abstractions.
- [ ] Avoid creating names using analogies from other contexts.
- [ ] No abbreviations in the domain: cust, prd, ord, inv... (Only if it is a universal and documented standard)
- [ ] Exception names = broken rule: OrderCannotBeCancelledException, InvalidTaxIdException, CustomerNotFoundException.
