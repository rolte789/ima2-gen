import { existsSync, readFileSync } from "fs";
import { dirname, join, relative } from "path";
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
  ima2 skill [<name>] [path] [--json]

  Print the packaged ima2 Markdown skill for agents.

  Commands:
    ima2 skill              Print skills/ima2/SKILL.md (core)
    ima2 skill front        Print skills/ima2-front/SKILL.md (frontend)
    ima2 skill uiux         Print skills/ima2-uiux/SKILL.md (design)
    ima2 skill ls            List all available skills
    ima2 skill path          Print core skill file path
    ima2 skill front path    Print frontend skill file path
    ima2 skill uiux path     Print design skill file path
    ima2 skill --json        Print JSON wrapper around the skill
    ima2 skill front --json  Print JSON wrapper for frontend skill
`;

const FLAGS = {
  json: { type: "boolean" },
  help: { short: "h", type: "boolean" },
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

  if (positional.length > 0 && positional[0] !== "path" && KNOWN_SKILLS[positional[0]]) {
    skillName = positional[0];
    if (positional[1] === "path") wantPath = true;
  } else if (positional[0] === "path") {
    wantPath = true;
  }

  const targetPath = resolveSkillPath(skillName);

  if (wantPath) {
    out(targetPath);
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
