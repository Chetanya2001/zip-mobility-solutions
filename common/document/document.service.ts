import { API_CONFIG, API_ENDPOINTS } from "../../config/api.config";

class DocumentService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  /**
   * Get authentication headers with token
   */
  private getAuthHeaders(token: string) {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Check if user is eligible to book (documents verified)
   */
  async checkBookingEligibility(token: string): Promise<{
    eligible: boolean;
    reason?: string;
    isEligible: boolean;
    all_documents_verified: boolean;
    documents_count: number;
    user_documents: any[];
    user_verified: boolean;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/user-document/check-eligibility`,
        {
          method: "GET",
          headers: this.getAuthHeaders(token),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to check eligibility");
      }

      return await response.json();
    } catch (error: any) {
      console.error("[DocumentService] checkEligibility error:", error);
      throw error;
    }
  }

  /**
   * Get user documents
   */
  async getUserDocuments(token: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/user-document/get-document`,
        {
          method: "GET",
          headers: this.getAuthHeaders(token),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch documents");
      }

      return await response.json();
    } catch (error: any) {
      console.error("[DocumentService] getUserDocuments error:", error);
      throw error;
    }
  }

  /**
   * Upload ID document
   */
  async uploadDocument(
    token: string,
    imageUri: string,
    documentType: string,
  ): Promise<any> {
    try {
      const formData = new FormData();

      // Convert image URI to blob for upload
      const filename = imageUri.split("/").pop() || "document.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("image", {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      formData.append("document_type", documentType);

      const response = await fetch(`${this.baseUrl}/user-documents/upload-id`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type, let browser set it with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload document");
      }

      return await response.json();
    } catch (error: any) {
      console.error("[DocumentService] uploadDocument error:", error);
      throw error;
    }
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePic(token: string, imageUri: string): Promise<any> {
    try {
      const formData = new FormData();

      const filename = imageUri.split("/").pop() || "profile.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("profile_pic", {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const response = await fetch(
        `${this.baseUrl}/user-profile/add-profile-image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload profile picture");
      }

      return await response.json();
    } catch (error: any) {
      console.error("[DocumentService] uploadProfilePic error:", error);
      throw error;
    }
  }
}

export const documentService = new DocumentService();
