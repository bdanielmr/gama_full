type SseClient = {
    id: string;
    write: (chunk: string) => void;
};
export declare class SseService {
    private clients;
    addClient(client: SseClient): void;
    removeClient(id: string): void;
    emit(data: any): void;
}
export {};
