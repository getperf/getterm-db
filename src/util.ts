export class Util {
    static removeTrailingSemicolon(input: string): string {
        return input.endsWith(';') ? input.slice(0, -1) : input;
    }

}
