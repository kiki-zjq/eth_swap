pragma solidity ^0.5.0;

import "./Token.sol";

contract EthSwap {
  string public name = "EthSwap Instant Exchange";
  Token public token;
  uint public rate = 100;

  event TokenPurchased(
    address account,
    address token,
    uint amount,
    uint rate 
  );

  event TokenSold(
    address account,
    address token,
    uint amount,
    uint rate 
  );

  constructor(Token _token) public {
    token = _token;
  }

  function buyTokens() public payable {
    // Redemption rate = # of tokens they receive for 1 ether
    // Amount of Ethereum * Redemption rate
    // Calculate the number of tokens to buy
    uint tokenAmount = msg.value * rate;
    require(token.balanceOf(address(this)) >= tokenAmount, "Some Notification");

    // Transfer tokens to the user
    token.transfer(msg.sender, tokenAmount);

    // Emit an event
    emit TokenPurchased(msg.sender, address(token), tokenAmount, rate);
  }

  function sellTokens(uint _amount) public {
    // User can't sell more tokens than they have
    require(token.balanceOf(msg.sender) >= _amount);

    uint etherAmount = _amount / rate;

    // Require that EthSwap has enough Ether
    require(address(this).balance >= etherAmount, "Some Notification");
    // Perform Sale
    token.transferFrom(msg.sender, address(this), _amount);
    msg.sender.transfer(etherAmount);

    emit TokenSold(msg.sender, address(token), _amount, rate);
  }
}