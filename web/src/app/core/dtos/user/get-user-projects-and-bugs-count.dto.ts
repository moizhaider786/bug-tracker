export interface StatusBreakdown {
  bugs:     { new: number; started: number; resolved: number };
  features: { new: number; started: number; resolved: number };
}

export interface GetUserProjectsAndBugsCountResponseDto {
  createdProjectsCount?: number;
  bugsInCreatedProjects?: { bugCount: number; featureCount: number };
  assignedProjectsCount?: number;
  assignedBugs?: { bugCount: number; featureCount: number };
  createdBugs?: { bugCount: number; featureCount: number };
  statusBreakdown?: StatusBreakdown;
}