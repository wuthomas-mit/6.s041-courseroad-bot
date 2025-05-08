// Import the text files as URLs
import eecsRequirementsURL from '../stores/Cleaned_EECS_Degree_Requirements.txt?url';
import eecsProgramsURL from '../stores/MIT_EECS_Program_Requirements_Cleaned.txt?url';

// This service provides access to MIT degree requirements data
class RequirementsService {
  constructor() {
    this.eecsRequirements = '';
    this.eecsPrograms = '';
    this.isLoaded = false;
    this.loadPromise = this.loadRequirementsData();
  }

  // Load the requirements data from text files
  async loadRequirementsData() {
    try {
      // Fetch both files in parallel using the imported URLs
      const [eecsReqResponse, eecsProgramsResponse] = await Promise.all([
        fetch(eecsRequirementsURL),
        fetch(eecsProgramsURL)
      ]);

      // Get the text content
      this.eecsRequirements = await eecsReqResponse.text();
      this.eecsPrograms = await eecsProgramsResponse.text();
      
      this.isLoaded = true;
      console.log('Requirements data loaded successfully');
      return true;
    } catch (error) {
      console.error('Error loading requirements data:', error);
      return false;
    }
  }

  // Ensure data is loaded before accessing
  async ensureDataLoaded() {
    if (!this.isLoaded) {
      await this.loadPromise;
    }
    return this.isLoaded;
  }

  // Get the EECS degree requirements text
  async getEECSRequirements() {
    await this.ensureDataLoaded();
    return this.eecsRequirements;
  }

  // Get the EECS program summary
  async getEECSProgramSummary() {
    await this.ensureDataLoaded();
    return this.eecsPrograms;
  }

  // Extract text about a specific program from the detailed requirements
  async getSpecificProgramRequirements(programId) {
    await this.ensureDataLoaded();
    
    // Only supported for Course 6 programs
    if (!programId.startsWith('major6')) {
      return null;
    }
    
    const programCode = programId.replace('major', '');
    
    // Extract the section relevant to this program
    // This is a simple extraction - might need more sophistication for production
    const lines = this.eecsRequirements.split('\n');
    let programSection = '';
    let inSection = false;
    
    // Look for the program code in headers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for program start
      if (line.includes(programCode) && 
         (line.includes('Science') || line.includes('Engineering') || 
          line.includes('Intelligence') || line.includes('Computer') || 
          line.includes('Electrical') || line.includes('Molecular'))) {
        inSection = true;
        programSection += line + '\n';
        continue;
      }
      
      // Check for next program start (end of current section)
      if (inSection && line.match(/^6-\d/) && !line.includes(programCode)) {
        break;
      }
      
      // Add lines while in the right section
      if (inSection) {
        programSection += line + '\n';
      }
    }
    
    return programSection || null;
  }
  
  // Get a formatted version of all requirements data
  async getAllRequirementsData() {
    await this.ensureDataLoaded();
    return {
      eecsRequirements: this.eecsRequirements,
      eecsPrograms: this.eecsPrograms
    };
  }

  // Get requirements text for specific programs
  async getRequirementsForPrograms(programIds) {
    await this.ensureDataLoaded();
    
    const result = {
      eecsPrograms: this.eecsPrograms
    };
    
    // If there are Course 6 programs, extract specific sections for them
    const course6Programs = programIds.filter(id => id.startsWith('major6'));
    
    if (course6Programs.length > 0) {
      // If we have specific Course 6 programs, get just those sections
      const programSections = await Promise.all(
        course6Programs.map(id => this.getSpecificProgramRequirements(id))
      );
      
      const validSections = programSections.filter(section => section !== null);
      
      if (validSections.length > 0) {
        result.eecsRequirements = validSections.join('\n\n');
      } else {
        // Fallback to the full requirements if extraction failed
        result.eecsRequirements = this.eecsRequirements;
      }
    }
    
    return result;
  }
}

// Create and export a singleton instance
const requirementsService = new RequirementsService();
export default requirementsService; 