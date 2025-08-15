import { UnrealNodeClass } from "../data/classes/unreal-node-class";
import { NodeFriendlyNames } from "./node-friendly-names";
import { NodeParser } from "./node.parser";

/**
 * Plugin interface for extending Klee with custom node parsers.
 *
 * To create a plugin
 * ```typescript
 *
 * import {YourParser} from "./your.parsers";
 *
 * export const plugin: NodeParserPlugin = {
 *     registerNodeParsers(): void {
 *         const registry = NodeParserRegistry.getInstance();
 *         registry.registerParser("/Script/Location.YourNodeClass", () => new YourParser());
 *     },
 *     nodeFriendlyNames: {
 *         'YourNodeClass': 'Your Friendly Name'
 *     }
 * };
 * ```
 */
export interface NodeParserPlugin {
    registerNodeParsers: () => void;
    nodeFriendlyNames: { [name: string]: string };
}

export class NodeParserRegistry {
    public parsers: Map<UnrealNodeClass, () => NodeParser> = new Map();

    private static instance: NodeParserRegistry;
    private pluginsLoaded: boolean = false;

    private constructor() {}

    public static getInstance(): NodeParserRegistry {
        if (!NodeParserRegistry.instance) {
            NodeParserRegistry.instance = new NodeParserRegistry();
        }
        return NodeParserRegistry.instance;
    }

    public autoLoadPlugins(): void {
        if (this.pluginsLoaded) return;

        try {
            this.loadPlugins();
        } catch (error) {
            console.error("Could not load plugins:", error);
        }
        this.pluginsLoaded = true;
    }

    private loadPlugins(): void {
        const pluginContext = (require as any).context('../plugins', false, /\.ts$/);
        const pluginPaths = pluginContext.keys();

        pluginPaths.forEach((pluginPath: string) => {
            try {
                const plugin = pluginContext(pluginPath);

                const registerParsers = plugin.plugin?.registerNodeParsers || plugin.registerNodeParsers;
                const friendlyNames = plugin.plugin?.nodeFriendlyNames || plugin.nodeFriendlyNames;

                if (!registerParsers || typeof registerParsers !== 'function') {
                    return;
                }

                registerParsers();

                if (friendlyNames && typeof friendlyNames === 'object') {
                    for (const [key, value] of Object.entries(friendlyNames)) {
                        NodeFriendlyNames[key] = value as string;
                    }
                }
            } catch (error) {
                console.error(`Error loading plugin ${pluginPath}:`, error);
            }
        });
    }

    public registerParser(nodeClass: string | UnrealNodeClass, parserFactory: () => NodeParser): void {
        this.parsers.set(nodeClass as UnrealNodeClass, parserFactory);
    }

    public getParser(nodeClass: UnrealNodeClass): (() => NodeParser) | undefined {
        return this.parsers.get(nodeClass);
    }
}
