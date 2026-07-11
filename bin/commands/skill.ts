import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { dirname, join, relative, basename, extname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "../lib/args.js";
import { die, json, out } from "../lib/output.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SKILLS_DIR = join(ROOT, "skills");
const PACKAGE_PATH = join(ROOT, "package.json");

const KNOWN_SKILLS: Record<string, { dir: string; description: string }> = {
  ima2: {
    dir: "ima2",
    description: "Core CLI reference, prompting protocol, provider routing",
  },
  front: {
    dir: "ima2-front",
    description: "Frontend implementation: assets, motion, responsive, a11y, anti-slop",
  },
  uiux: {
    dir: "ima2-uiux",
    description: "Design direction discovery, UX judgment, image-first ism workflow",
  },
};

const HELP = `
  ima2 skill [<name>] [path|refs|ref <name>] [--json] [--with-refs]

  Print packaged ima2 Markdown skills and reference modules for agents.

  Commands:
    ima2 skill              Print skills/ima2/SKILL.md (core)
    ima2 skill front        Print skills/ima2-front/SKILL.md (frontend)
    ima2 skill uiux         Print skills/ima2-uiux/SKILL.md (design)
    ima2 skill ls            List all available skills
    ima2 skill <name> path   Print skill file path

  Reference modules:
    ima2 skill <name> refs          List reference modules for a skill
    ima2 skill <name> ref <name>    Print one reference module
    ima2 skill <name> --with-refs   Print SKILL.md + all reference modules bundled

  Examples:
    ima2 skill front refs                  List all frontend references
    ima2 skill front ref motion            Print references/motion.md
    ima2 skill uiux ref design-isms        Print references/design-isms.md
    ima2 skill front --with-refs           Bundle skill + all refs into one output
    ima2 skill front --with-refs --json    Same, as JSON

  Agent note:
    SKILL.md files reference modules via relative paths like "references/motion.md".
    Use 'refs' to discover available modules, then load them on demand with 'ref'
    to keep context lean. Use '--with-refs' for a full context bundle.

  Options:
    --json         Print JSON wrapper
    --with-refs    Bundle SKILL.md + all reference modules
    -h, --help     Show help
`;

const FLAGS = {
  json: { type: "boolean" },
  help: { short: "h", type: "boolean" },
  "with-refs": { type: "boolean" },
};

function readPackageVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(PACKAGE_PATH, "utf-8")) as { version?: string };
    return pkg.version || "?";
  } catch {
    return "?";
  }
}

function resolveSkillPath(name: string): string {
  const entry = KNOWN_SKILLS[name];
  if (!entry) die(2, `unknown skill: "${name}". Available: ${Object.keys(KNOWN_SKILLS).join(", ")}`);
  return join(SKILLS_DIR, entry.dir, "SKILL.md");
}

function readSkill(path: string): string {
  if (!existsSync(path)) {
    die(5, `packaged skill not found: ${path}`);
  }
  return readFileSync(path, "utf-8");
}

// ── Reference discovery helpers ──

interface RefEntry {
  name: string;
  file: string;
  relPath: string;
  absPath: string;
  lines: number;
}

function discoverRefs(skillDir: string): RefEntry[] {
  const refsDir = join(skillDir, "references");
  if (!existsSync(refsDir)) return [];
  const entries: RefEntry[] = [];

  function walk(dir: string, prefix: string) {
    for (const item of readdirSync(dir)) {
      const full = join(dir, item);
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full, prefix ? `${prefix}/${item}` : item);
      } else if (extname(item) === ".md") {
        const nameNoExt = basename(item, ".md");
        const qualName = prefix ? `${prefix}/${nameNoExt}` : nameNoExt;
        const relFile = prefix ? `${prefix}/${item}` : item;
        entries.push({
          name: qualName,
          file: relFile,
          relPath: `references/${relFile}`,
          absPath: full,
          lines: readFileSync(full, "utf-8").split("\n").length,
        });
      }
    }
  }

  walk(refsDir, "");
  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

function resolveRef(skillDir: string, refName: string): RefEntry | null {
  const refs = discoverRefs(skillDir);
  const exact = refs.find((r) => r.name === refName);
  if (exact) return exact;
  const byBase = refs.filter((r) => {
    const parts = r.name.split("/");
    return parts[parts.length - 1] === refName;
  });
  if (byBase.length === 1) return byBase[0];
  const partial = refs.filter((r) => r.name.includes(refName));
  if (partial.length === 1) return partial[0];
  return null;
}

function bundleWithRefs(skillContent: string, skillDir: string): string {
  const refs = discoverRefs(skillDir);
  if (refs.length === 0) return skillContent;
  const parts = [skillContent.replace(/\n$/, "")];
  parts.push("\n\n---\n\n# Bundled Reference Modules\n");
  for (const ref of refs) {
    const content = readFileSync(ref.absPath, "utf-8").replace(/\n$/, "");
    parts.push(`\n## [ref: ${ref.name}] (${ref.relPath})\n\n${content}\n`);
  }
  return parts.join("");
}

// ── Main command ──

export default async function skillCmd(argv: string[]) {
  const args = parseArgs(argv, { flags: FLAGS });
  if (args.help) {
    out(HELP);
    return;
  }

  const positional = args.positional as string[];

  // ima2 skill ls — list available skills
  if (positional[0] === "ls" || positional[0] === "list") {
    if (args.json) {
      const skills = Object.entries(KNOWN_SKILLS).map(([name, info]) => {
        const skillPath = join(SKILLS_DIR, info.dir, "SKILL.md");
        return {
          name,
          dir: info.dir,
          description: info.description,
          path: relative(ROOT, skillPath),
          installed: existsSync(skillPath),
        };
      });
      json({ skills });
    } else {
      out("\n  Available ima2 skills:\n");
      for (const [name, info] of Object.entries(KNOWN_SKILLS)) {
        const skillPath = join(SKILLS_DIR, info.dir, "SKILL.md");
        const status = existsSync(skillPath) ? "✓" : "✗";
        out(`    ${status}  ${name.padEnd(8)} ${info.description}`);
      }
      out(`\n  Usage: ima2 skill <name>       Print a skill`);
      out(`         ima2 skill <name> path   Print its file path\n`);
    }
    return;
  }

  // Determine which skill to read
  let skillName = "ima2";
  let wantPath = false;
  let wantRefs = false;
  let wantRef: string | null = null;

  if (positional.length > 0 && positional[0] !== "path" && positional[0] !== "refs" && positional[0] !== "ref" && KNOWN_SKILLS[positional[0]]) {
    skillName = positional[0];
    if (positional[1] === "path") wantPath = true;
    else if (positional[1] === "refs") wantRefs = true;
    else if (positional[1] === "ref" && positional[2]) wantRef = positional[2];
  } else if (positional[0] === "path") {
    wantPath = true;
  } else if (positional[0] === "refs") {
    wantRefs = true;
  } else if (positional[0] === "ref" && positional[1]) {
    wantRef = positional[1];
  }

  const targetPath = resolveSkillPath(skillName);

  if (wantPath) {
    out(targetPath);
    return;
  }

  const skillDir = dirname(targetPath);

  // ima2 skill <name> refs — list reference modules
  if (wantRefs) {
    const refs = discoverRefs(skillDir);
    if (refs.length === 0) {
      if (args.json) {
        json({ skill: skillName, refs: [] });
      } else {
        out(`\n  No reference modules for skill "${skillName}".\n`);
      }
      return;
    }
    if (args.json) {
      json({
        skill: skillName,
        refs: refs.map((r) => ({
          name: r.name,
          file: r.relPath,
          lines: r.lines,
        })),
      });
    } else {
      out(`\n  Reference modules for "${skillName}" (${refs.length} files):\n`);
      for (const r of refs) {
        out(`    ${r.name.padEnd(30)} ${String(r.lines).padStart(4)} lines`);
      }
      out(`\n  Load one:  ima2 skill ${skillName} ref <name>`);
      out(`  Load all:  ima2 skill ${skillName} --with-refs\n`);
    }
    return;
  }

  // ima2 skill <name> ref <refname> — print one reference module
  if (wantRef) {
    const ref = resolveRef(skillDir, wantRef);
    if (!ref) {
      const refs = discoverRefs(skillDir);
      const available = refs.map((r) => r.name).join(", ");
      die(2, `reference "${wantRef}" not found in skill "${skillName}". Available: ${available}`);
    }
    const content = readFileSync(ref.absPath, "utf-8");
    if (args.json) {
      json({
        skill: skillName,
        ref: ref.name,
        file: ref.relPath,
        lines: ref.lines,
        content,
      });
    } else {
      out(content.replace(/\n$/, ""));
    }
    return;
  }

  // --with-refs: bundle SKILL.md + all reference modules
  if (args["with-refs"]) {
    const content = readSkill(targetPath);
    const bundled = bundleWithRefs(content, skillDir);
    if (args.json) {
      json({
        name: skillName === "ima2" ? "ima2" : `ima2-${skillName}`,
        format: "markdown-skill-bundled",
        formatVersion: "1",
        packageVersion: readPackageVersion(),
        path: relative(ROOT, targetPath),
        refCount: discoverRefs(skillDir).length,
        source: "package",
        content: bundled,
      });
    } else {
      out(bundled.replace(/\n$/, ""));
    }
    return;
  }

  const content = readSkill(targetPath);
  if (args.json) {
    json({
      name: skillName === "ima2" ? "ima2" : `ima2-${skillName}`,
      format: "markdown-skill",
      formatVersion: "1",
      packageVersion: readPackageVersion(),
      path: relative(ROOT, targetPath),
      source: "package",
      content,
    });
    return;
  }

  out(content.replace(/\n$/, ""));
}
