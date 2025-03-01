import * as sshConfig from 'ssh-config';

declare module 'ssh-config' {
    export interface ConfigEntry {
        param: string;
        value: string;
    }

    export interface Config {
        // 例: Host エントリーのリストを保持する
        filter(predicate: (entry: ConfigEntry) => boolean): ConfigEntry[];
    }

    export function parse(configText: string): Config;
}
