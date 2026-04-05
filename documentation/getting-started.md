# Getting Started with Karpathypedia

This guide walks you through setting up, running, and using Karpathypedia — an LLM-powered knowledge base with a Wikipedia-style UI, built on Blockify IdeaBlocks.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.17 or later (recommended: 20.x LTS)
- **npm** 9.x or later (comes with Node.js)
- **Git** for version control

Verify your installation:

```bash
node --version   # Should output v18.17.0 or later
npm --version    # Should output 9.x or later
```

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/karpathypedia-with-blockify.git
cd karpathypedia-with-blockify
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required packages including Next.js, TypeScript, Tailwind CSS, Fuse.js for search, and the markdown processing pipeline (remark, rehype).

### 3. Environment Configuration

Create a `.env.local` file in the project root:

```env
# Required for pipeline operations (ingest, distill, compile)
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o
LLM_API_KEY=your-api-key-here

# Required for embedding-based features
EMBEDDING_MODEL=text-embedding-3-small

# Optional: Override defaults
CHUNK_SIZE=512
CHUNK_OVERLAP=50
```

> **Note**: The `.env.local` file is git-ignored and should never be committed. For the wiki UI to function with sample data, no API keys are required — they are only needed for running the pipeline to generate new content.

## Running the Development Server

Start the Next.js development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm test` | Run unit tests with Jest |
| `npm run lint` | Run ESLint code quality checks |

## Exploring the Sample Data

Karpathypedia ships with sample data so you can explore the system immediately:

- **15 IdeaBlocks** covering AI/ML topics (neural networks, transformers, LLMs, RAG, tokenization, etc.)
- **5 Wiki Articles** compiled from those blocks
- **4 Categories**: Architecture, Foundations, Applications, Data Processing

Navigate to the following pages:

| URL | What You'll See |
|-----|----------------|
| `/` | Homepage with featured articles and system stats |
| `/wiki/transformer-architecture` | Sample article on transformer architecture |
| `/wiki/large-language-models` | Sample article on LLMs |
| `/explore` | IdeaBlock Explorer — browse all knowledge atoms |
| `/categories` | Browse articles by category |
| `/search?q=attention` | Search across articles and blocks |

## Adding Raw Documents

To add new source material to the knowledge base:

### 1. Place Documents in the Raw Directory

```bash
cp your-document.pdf data/raw/
cp your-notes.md data/raw/
```

Supported formats: `.pdf`, `.txt`, `.md`

### 2. Run the Ingest Pipeline

```bash
npx tsx pipeline/ingest.ts
```

This will:
1. Parse each document in `data/raw/`
2. Chunk the text into semantically coherent segments
3. Extract critical questions and answers from each chunk
4. Create raw IdeaBlocks in `data/ideablocks/blocks.json`
5. Run deduplication to remove near-duplicate blocks

### 3. Optional: Run Distillation

Distillation uses an LLM to refine raw blocks for clarity and accuracy:

```bash
npx tsx pipeline/ingest.ts --distill
```

This step requires a valid `LLM_API_KEY` in your `.env.local` file.

## Running the Pipeline

The full pipeline transforms raw documents into published wiki articles:

### Step-by-Step

```bash
# Step 1: Ingest raw documents into IdeaBlocks
npx tsx pipeline/ingest.ts

# Step 2: Compile IdeaBlocks into wiki articles
npx tsx pipeline/compile.ts

# Step 3: Validate everything is consistent
npx tsx pipeline/lint.ts
```

### Full Pipeline (All Steps)

```bash
npx tsx pipeline/ingest.ts && npx tsx pipeline/compile.ts && npx tsx pipeline/lint.ts
```

### Pipeline Output

After running the pipeline, you'll find:

| Output | Location |
|--------|----------|
| IdeaBlocks | `data/ideablocks/blocks.json` |
| Wiki Articles | `data/wiki/*.md` |
| Wiki Index | `data/index/wiki-index.json` |

## Viewing the Wiki

After running the pipeline (or using the included sample data):

1. Start the dev server: `npm run dev`
2. Open [http://localhost:3000](http://localhost:3000) in your browser
3. Browse articles via the homepage, categories, or search
4. Click on any article to read the full content
5. Visit `/explore` to browse individual IdeaBlocks

## Project Structure Overview

```
karpathypedia-with-blockify/
├── data/                  # All content data
│   ├── raw/               # Source documents (input)
│   ├── ideablocks/        # Processed IdeaBlocks (JSON)
│   ├── wiki/              # Compiled articles (Markdown)
│   └── index/             # Search and navigation index
├── documentation/         # Project documentation
├── pipeline/              # Ingest, compile, and lint scripts
├── src/
│   ├── app/               # Next.js pages and API routes
│   ├── components/        # React UI components
│   └── lib/               # Data layer and utilities
├── tests/                 # Unit and integration tests
└── public/                # Static assets
```

## Troubleshooting

### Common Issues

**Port 3000 is already in use**
```bash
npm run dev -- -p 3001
```

**Pipeline fails with LLM API error**
- Verify your `LLM_API_KEY` is set in `.env.local`
- Check that the API key has sufficient quota
- Ensure `LLM_MODEL` is set to a model your key has access to

**No articles appear in the UI**
- Verify `data/wiki/` contains `.md` files
- Verify `data/index/wiki-index.json` exists and lists the articles
- Restart the dev server after adding new data files

**Search returns no results**
- The search index is built at request time from the wiki index
- Ensure `data/index/wiki-index.json` is up to date
- Run `npx tsx pipeline/lint.ts` to check for data issues

## Next Steps

- Read the [Architecture Overview](/documentation/architecture-overview.md) to understand the full system design
- Read the [Blockify Integration Guide](/documentation/blockify-integration-guide.md) for pipeline details
- Add your own documents to `data/raw/` and run the pipeline
- Customize the UI components in `src/components/`
