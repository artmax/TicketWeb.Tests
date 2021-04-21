const TicketFactory = artifacts.require("TicketFactory");
const { expectEvent, expectRevert, constants } = require("@openzeppelin/test-helpers");

const ticketOffice = require('./../build/contracts/TicketOffice.json')

const BN = require('bn.js');

contract('TicketFactory test', (accounts) => {

  const [ owner, buyer] = accounts;

  let ticketFactory;

  let newEventModel;
  let createdEvent;

  let ticketPrice = 0.1 * 100000000000000000;

  before('setup others', async function() {
   
    ticketFactory = await TicketFactory.new({from: owner});

    newEventModel = {
      eventName: 'Event 1',
      eventDescription: 'Event Description',
      eventPosterURI:'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4',
      ticketSymbol: 'Ev1',
      ticketPrice: new BN(ticketPrice.toString(), 10),
      startAt: Date.now(),
      eventDuration: 60,
      maxTickets: 1
    };

  });

  it('should return the events count', async () => {

    let count = await ticketFactory.countEvents();

    assert.equal(count.toNumber(), 0, "The count of event should be 0");
  });

  it('should create an event', async () => {  

    await ticketFactory.addEvent(
      newEventModel.eventName, 
      newEventModel.eventDescription,
      newEventModel.eventPosterURI, 
      newEventModel.ticketSymbol, 
      newEventModel.ticketPrice, 
      newEventModel.startAt, 
      newEventModel.eventDuration, 
      newEventModel.maxTickets,
      { "from": owner, gas: 6000000 });    

     let count = await ticketFactory.countEvents();   

     createdEvent = await ticketFactory.eventsList(0);     

     assert.equal(createdEvent.eventName, newEventModel.eventName, "The name of event is not correct");
     assert.equal(createdEvent.eventDescription, newEventModel.eventDescription, "The event description is not correct");
     assert.equal(createdEvent.eventPosterURI, newEventModel.eventPosterURI, "The Poster URI of event is not correct");
     assert.equal(createdEvent.ticketSymbol, newEventModel.ticketSymbol, "The ticket symbol of event is not correct");
     assert.equal(createdEvent.ticketPrice, ticketPrice, "The ticket price of event is not correct");
     assert.equal(createdEvent.startAt, newEventModel.startAt, "The start at date of event is not correct");
     assert.equal(createdEvent.eventDuration, newEventModel.eventDuration, "The event duration is not correct");
     assert.equal(createdEvent.maxTickets, newEventModel.maxTickets, "The maxTickets count of event is not correct");  

     assert.equal(count.toNumber(), 1, "The count of event should be 1");
  });

  it('should not create an event by not owner', async () => {  

      await expectRevert(
        ticketFactory.addEvent(
          newEventModel.eventName, 
          newEventModel.eventDescription,
          newEventModel.eventPosterURI, 
          newEventModel.ticketSymbol, 
          newEventModel.ticketPrice, 
          newEventModel.startAt, 
          newEventModel.eventDuration, 
          newEventModel.maxTickets,
          { "from": buyer, gas: 6000000 }),
        'Owner only' 
    );
  });

   it('Buyer should be able to buy ticket', async () => {  
    
     let ticketOfficeContract = new web3.eth.Contract(ticketOffice.abi, createdEvent.eventAddress);

     let receipt = await ticketOfficeContract.methods.mint().send({ "from": buyer, gas: 1000000, "value": newEventModel.ticketPrice });     

     await expectEvent(
      receipt,
      'NewTicket',
      {id: '1', buyer: buyer}
     );

   });

   it('Buyer should not be able to buy more ticket that maximum field defines', async () => {  
    
    let ticketOfficeContract = new web3.eth.Contract(ticketOffice.abi, createdEvent.eventAddress);   

     await expectRevert(
      ticketOfficeContract.methods.mint().send({ "from": buyer, gas: 1000000, "value": newEventModel.ticketPrice }),
      'Tickets sold' 
    );

  }); 
});
