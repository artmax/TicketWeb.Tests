// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "./Dependencies.sol";

/// @title dApp for sale tickets with Ethereum blockchain
/// @author Yury Cooliq <yurycooliq@gmail.com>
/// @notice Create events ant sale tickets on it
/// @dev Use it on your own risk!
contract TicketOffice is ERC721
{
    using Counters for Counters.Counter;

    event NewTicket(uint indexed id, address buyer);
    event TicketsSold(uint timestamp, uint totalTickets);

    address payable public owner;
    address public factory;
    uint public ticketPrice;
    uint public maxTickets;
    uint public eventID;
    bool public sold = false;
    Counters.Counter private _tokenIds;

    struct Ticket {
        uint id;
        uint eventId;
        address buyer;
    }

    Ticket[] public tickets;

    mapping (uint => address) addressByTicketId;
    mapping (address => uint[]) ticketsByAddress;

    constructor(
        address payable _owner,
        address _factory,
        string memory _eventName,
        string memory _ticketSymbol,
        uint _ticketPrice,
        uint _maxTickets,
        uint _eventID
    ) ERC721(_eventName, _ticketSymbol) public {
        owner = _owner;
        factory = _factory;
        ticketPrice = _ticketPrice;
        maxTickets = _maxTickets;
        eventID = _eventID;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Owner only");
        _;
    }

    modifier checkBalance() {
        require(msg.value == ticketPrice, "Wrong value");
        _;
    }

    modifier notSold() {
        require(!sold, "Tickets sold");
        _;
    }

    function setTicketPrice(uint _newPrice) public onlyOwner {
        ticketPrice = _newPrice;
    }

    function mint() public payable checkBalance notSold {
        // Get mintable ID
        _tokenIds.increment();
        uint tokenID = _tokenIds.current();
        // Take money
        owner.transfer(msg.value);
        // Mint token
        _mint(msg.sender, tokenID);
        // Save ticket
        Ticket memory ticket = Ticket(tokenID, eventID, msg.sender);
        tickets.push(ticket);
        // Create event
        emit NewTicket(tokenID, msg.sender);
        if (tokenID == maxTickets) {
            sold = true;
            emit TicketsSold(now, maxTickets);
        }
    }
}
