import { prisma } from "../../config/prisma";

interface CreateRequestData {
  title: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
}

export const conferenceRequestService = {
  /**
   * Create a new conference request
   */
  async createRequest(requesterId: string, data: CreateRequestData) {
    if (!data.title) {
      throw new Error("Title is required");
    }

    const request = await prisma.conferenceRequest.create({
      data: {
        requesterId,
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        status: "pending",
      },
      include: {
        requester: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return request;
  },

  /**
   * Get conference requests by user
   */
  async getRequestsByUser(requesterId: string) {
    const requests = await prisma.conferenceRequest.findMany({
      where: {
        requesterId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return requests;
  },

  /**
   * Get all conference requests (for admin)
   */
  async getAllRequests() {
    const requests = await prisma.conferenceRequest.findMany({
      include: {
        requester: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return requests;
  },

  /**
   * Get a single conference request by ID
   */
  async getRequestById(requestId: string) {
    const request = await prisma.conferenceRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return request;
  },

  /**
   * Approve a conference request
   * Creates the actual Conference and assigns chair role to requester
   */
  async approveRequest(
    requestId: string,
    adminId: string,
    price?: number,
    currency: string = "USD"
  ) {
    // Get the request
    const request = await prisma.conferenceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error("Conference request not found");
    }

    if (request.status !== "pending") {
      throw new Error(`Request is already ${request.status}`);
    }

    // Use transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Update request status to approved
      const updatedRequest = await tx.conferenceRequest.update({
        where: { id: requestId },
        data: {
          status: "approved",
        },
      });

      // Create the actual Conference
      const conference = await tx.conference.create({
        data: {
          name: request.title,
          description: request.description,
          startDate: request.startDate || new Date(),
          endDate: request.endDate || new Date(),
        },
      });

      // Assign chair role to the requester
      const chairRole = await tx.conferenceMember.create({
        data: {
          userId: request.requesterId,
          conferenceId: conference.id,
          role: "CHAIR",
        },
      });

      return {
        request: updatedRequest,
        conference,
        chairRole,
      };
    });

    return result;
  },

  /**
   * Reject a conference request
   */
  async rejectRequest(requestId: string, adminId: string, comment?: string) {
    // Get the request
    const request = await prisma.conferenceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error("Conference request not found");
    }

    if (request.status !== "pending") {
      throw new Error(`Request is already ${request.status}`);
    }

    // Update request status to rejected
    const updatedRequest = await prisma.conferenceRequest.update({
      where: { id: requestId },
      data: {
        status: "rejected",
        adminComment: comment,
      },
      include: {
        requester: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updatedRequest;
  },
};

