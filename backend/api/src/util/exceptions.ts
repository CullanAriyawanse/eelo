export class BadRequestError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        this.logError();
    }
  
    logError() {
      console.error(this.message); 
    }
  }
  
  export class AlreadyExistsError extends BadRequestError { 
    constructor(message: string) { 
      super(message); 
      this.name = 'AlreadyExistsError'
    } 
  }
  
  export class InvalidParamError extends BadRequestError {
    constructor(message: string) { 
      super(message); 
      this.name = 'InvalidParamError'
    } 
  }
  
  export class InvalidSessionName extends BadRequestError {
    constructor(message = 'Please provide a session name without the characters # or :') { 
      super(message); 
      this.name = 'InvalidSessionName'
    } 
  }
  
  export class InvalidTrackDayDate extends BadRequestError {
    constructor(message = 'Please provide a valid track day date') {
      super(message);
      this.name = "InvalidTrackDayDate"
    }
  }
  
  export class DataServiceError extends BadRequestError {
    constructor(message: string) { 
      super(message); 
      this.name = 'DataServiceError'
    } 
  }
  