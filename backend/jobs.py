
import asyncio
import crud
import models
from database import SessionLocal
import scraper

async def check_simulated_bets():
    """
    Background job to check status of monitored/simulated bets.
    Uses REAL live data from the scraper.
    """
    db = SessionLocal()
    try:
        # 1. Get ALL live games currently on Betano
        live_data_result = scraper.get_live_opportunities_sync()
        live_games = live_data_result.get("all_games", [])
        
        # Create a lookup dict for faster access: "Home vs Away" -> GameData
        live_lookup = {}
        for g in live_games:
            key = f"{g['home'].lower()} vs {g['away'].lower()}"
            live_lookup[key] = g

        # 2. Get pending simulated bets
        pending_bets = db.query(models.BetHistory).filter(
            models.BetHistory.status == "pending",
            models.BetHistory.is_simulated == True
        ).all()
        
        print(f"[REAL MONITOR] Checking {len(pending_bets)} pending simulated bets against {len(live_games)} live games...")
        
        for bet in pending_bets:
            if not bet.games_data:
                continue

            # We assume single bets for simulation for now, or all-must-win for combo
            # Simplification: Check the first game (since dashboard adds 1 by 1)
            # In a full combo system, we would check all.
            
            # COPY data to modify it
            games_data = list(bet.games_data)
            game_data = games_data[0]
            
            # Identify game
            home = game_data.get('home', '').lower()
            away = game_data.get('away', '').lower()
            key = f"{home} vs {away}"
            
            # Find in live
            current_game = live_lookup.get(key)
            
            # Fallback fuzzy search if exact key fails
            if not current_game:
                for k, g in live_lookup.items():
                    if home in k and away in k:
                        current_game = g
                        break
            
            import datetime
            now = datetime.datetime.utcnow()
            minutes_since_update = (now - (bet.updated_at or bet.created_at)).total_seconds() / 60
            
            is_finished = False
            final_home = 0
            final_away = 0
            final_corners = 0

            if current_game:
                # UPDATE INFO
                score = current_game.get('score', {'home': 0, 'away': 0})
                minute = current_game.get('minute', 0)
                stats = current_game.get('stats', {})
                corners = stats.get('corners', {'home': 0, 'away': 0})
                total_corners = corners.get('home', 0) + corners.get('away', 0)
                
                # Update stored state
                game_data['current_score'] = score
                game_data['current_minute'] = minute
                game_data['current_corners'] = total_corners
                
                # Check for finish
                if minute >= 95: # Extended time usually ends by 98
                    is_finished = True
                    final_home = score['home']
                    final_away = score['away']
                    final_corners = total_corners
            
            else:
                # Game NOT in live feed
                # If it was late game > 85m last time, assume finished with last known score
                last_minute = game_data.get('current_minute', game_data.get('minute', 0))
                
                if last_minute >= 80:
                    # Assume finished
                    is_finished = True
                    score = game_data.get('current_score', game_data.get('score', {'home': 0, 'away': 0}))
                    final_home = score.get('home', 0)
                    final_away = score.get('away', 0)
                    final_corners = game_data.get('current_corners', 0)
                elif minutes_since_update > 180:
                     # 3 hours without update? Force close as Lost or Void (Assuming Lost for safety)
                     # Or keep pending? Let's keep pending unless very old
                     if minutes_since_update > 300: # 5 hours
                         bet.status = "void"
                         continue

            # EVALUATE RESULT
            if is_finished:
                bet_type = game_data.get('bet_type', 'WINNER')
                recommendation = game_data.get('recommendation', '')
                
                won = False
                
                # Logic Parser
                if bet_type == 'WINNER' or 'Vitória' in recommendation or bet_type == 'SAFE_WIN':
                    # Who did we bet on?
                    # Recommendation usually says "Vitória TeamX"
                    # We infer from 'home' name match
                    bet_on_home = home in recommendation.lower() or game_data.get('home') in recommendation
                    
                    if bet_on_home:
                        won = final_home > final_away
                    else:
                        won = final_away > final_home
                        
                elif bet_type == 'UNDER' or 'Menos de' in recommendation:
                    # Extract number "Menos de 3.5"
                    import re
                    match = re.search(r'(\d+\.?\d*)', recommendation)
                    if match:
                        line = float(match.group(1))
                        total_goals = final_home + final_away
                        won = total_goals < line
                    else:
                        # Fallback safe
                        won = False
                        
                elif bet_type == 'OVER' or 'Mais de' in recommendation:
                     match = re.search(r'(\d+\.?\d*)', recommendation)
                     if match:
                        line = float(match.group(1))
                        total_goals = final_home + final_away
                        won = total_goals > line
                        
                elif bet_type == 'CORNERS' or 'Cantos' in recommendation or 'Escanteios' in recommendation:
                     match = re.search(r'(\d+\.?\d*)', recommendation)
                     if match:
                        line = float(match.group(1))
                        won = final_corners > line
                
                # SET FINAL STATUS
                bet.status = "won" if won else "lost"
                bet.result_amount = bet.potential_return if won else 0
                bet.settled_at = datetime.datetime.utcnow()
                
                # Update games_data with final snapshot
                bet.games_data = games_data
                
                print(f" -> Bet {bet.id} finished: {bet.status} (Score: {final_home}-{final_away})")
            
            else:
                 # Update validation timestamp even if pending
                 bet.updated_at = now
                 # Update JSON in DB to reflect live score changes
                 bet.games_data = games_data
                 
        db.commit()
    except Exception as e:
        print(f"Error in REAL monitoring job: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(check_simulated_bets())
