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
  
  export class InvalidRole extends BadRequestError {
    constructor(message = 'Non-admin role cannot perform this request') { 
      super(message); 
      this.name = 'InvalidRole'
    } 
  }

  export class DataServiceError extends BadRequestError {
    constructor(message: string) { 
      super(message); 
      this.name = 'DataServiceError'
    } 
  }
  