import { HeaderMetadata } from "../Constants/HeaderMetadataRegistry";

export interface MetadataPort {
    updateBlockMetadata(filePath: string, blockId: string, metadata: HeaderMetadata): Promise<void>;
    getFileMetadata(filePath: string): Promise<Record<string, Record<string, any>>>;
}
