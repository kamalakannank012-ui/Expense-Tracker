
import { useEffect, useMemo, useState } from "react";
import API from "../api";
import "./SmartSavings.css";

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

export default function SmartSavings({ expenses = [] }) {
  const [goals, setGoals] = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [goalsError, setGoalsError] = useState("");

  const [isExpanded, setIsExpanded] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState({});
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load this logged-in user's savings goals from MongoDB.
  useEffect(() => {
    let active = true;

    async function fetchGoals() {
      try {
        setGoalsLoading(true);
        setGoalsError("");

        const response = await API.get("/savings-goals");

        if (active) {
          setGoals(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        if (active) {
          setGoalsError(
            error.response?.data?.message ||
              "Unable to load savings goals. Please check your login."
          );
        }
      } finally {
        if (active) {
          setGoalsLoading(false);
        }
      }
    }

    fetchGoals();

    return () => {
      active = false;
    };
  }, []);

  // Calculate current-month financial summary.
  const summary = useMemo(() => {
    const now = new Date();

    const currentMonth = expenses.filter((item) => {
      const rawDate = item.date || item.createdAt;
      if (!rawDate) return false;

      const date = new Date(rawDate);

      return (
        !Number.isNaN(date.getTime()) &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });

    const income = currentMonth
      .filter((item) => item.type === "Income")
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const spending = currentMonth
      .filter((item) => item.type === "Expense")
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const remaining = income - spending;

    const suggestedSavings = Math.min(
      Math.max(0, income * 0.2),
      Math.max(0, remaining)
    );

    const categories = {};

    currentMonth
      .filter((item) => item.type === "Expense")
      .forEach((item) => {
        const category = item.category || "Other";

        categories[category] =
          (categories[category] || 0) +
          (Number(item.amount) || 0);
      });

    const topCategory = Object.entries(categories).sort(
      (a, b) => b[1] - a[1]
    )[0];

    return {
      income,
      spending,
      remaining,
      suggestedSavings,
      topCategory,
    };
  }, [expenses]);

  // Create a savings goal in MongoDB.
  async function addGoal(event) {
    event.preventDefault();

    const name = goalName.trim();
    const target = Number(goalAmount);

    if (!name || !Number.isFinite(target) || target < 1) {
      setGoalsError("Enter a goal name and a valid target amount.");
      return;
    }

    try {
      setSubmitting(true);
      setGoalsError("");

      const response = await API.post("/savings-goals", {
        name,
        target,
      });

      setGoals((current) => [response.data, ...current]);
      setGoalName("");
      setGoalAmount("");
      setShowGoalForm(false);
    } catch (error) {
      setGoalsError(
        error.response?.data?.message ||
          "Unable to create savings goal."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Add savings to an existing goal in MongoDB.
  async function addSavings(event, goal) {
    event.preventDefault();

    const amount = Number(savedAmount[goal._id]);

    if (!Number.isFinite(amount) || amount <= 0) {
      setGoalsError("Enter a valid savings amount.");
      return;
    }

    try {
      setSubmitting(true);
      setGoalsError("");

      const response = await API.patch(
        `/savings-goals/${goal._id}/saved`,
        { amount }
      );

      setGoals((current) =>
        current.map((item) =>
          item._id === goal._id ? response.data : item
        )
      );

      setSavedAmount((current) => ({
        ...current,
        [goal._id]: "",
      }));
    } catch (error) {
      setGoalsError(
        error.response?.data?.message ||
          "Unable to update savings."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Delete a goal from MongoDB.
  async function deleteGoal(goalId) {
    if (!window.confirm("Are you sure you want to delete this goal?")) {
      return;
    }

    try {
      setGoalsError("");

      await API.delete(`/savings-goals/${goalId}`);

      setGoals((current) =>
        current.filter((goal) => goal._id !== goalId)
      );
    } catch (error) {
      setGoalsError(
        error.response?.data?.message ||
          "Unable to delete savings goal."
      );
    }
  }

  return (
    <section className="smart-savings">
      <header className="ss-header">
        <div className="ss-header-content">
          <span className="ss-eyebrow">
            SMART MONEY MANAGEMENT
          </span>

          <h2>Smart Savings</h2>

          <p>Track your money and work toward your goals.</p>
        </div>

        <div className="ss-header-icon" aria-hidden="true">
          💰
        </div>
      </header>

      <div className="ss-stats">
        <article className="ss-stat-card">
          <span>Monthly income</span>
          <strong>{money(summary.income)}</strong>
        </article>

        <article className="ss-stat-card">
          <span>Monthly expenses</span>
          <strong>{money(summary.spending)}</strong>
        </article>

        <article className="ss-stat-card">
          <span>Money remaining</span>

          <strong
            className={
              summary.remaining < 0
                ? "ss-negative"
                : "ss-positive"
            }
          >
            {money(summary.remaining)}
          </strong>
        </article>

        <article className="ss-stat-card ss-highlight">
          <span>Suggested savings</span>
          <strong>{money(summary.suggestedSavings)}</strong>

          <small>
            Up to 20% of income, within your remaining balance
          </small>
        </article>
      </div>

      <section className="ss-insight">
        <div className="ss-section-heading">
          <span aria-hidden="true">💡</span>
          <h3>Smart Insight</h3>
        </div>

        {summary.income <= 0 ? (
          <p>
            Add an income transaction dated this month to calculate
            a savings suggestion.
          </p>
        ) : summary.remaining <= 0 ? (
          <p>
            Your current expenses have used up your income. Review
            your spending before setting a savings target.
          </p>
        ) : (
          <p>
            You have <strong>{money(summary.remaining)}</strong>{" "}
            remaining this month. Consider saving up to{" "}
            <strong>{money(summary.suggestedSavings)}</strong> after
            covering essential bills.
          </p>
        )}

        {summary.topCategory && (
          <p>
            Your highest-spending category is{" "}
            <strong>{summary.topCategory[0]}</strong> (
            {money(summary.topCategory[1])}). Review this category
            for possible savings.
          </p>
        )}
      </section>

      <section className="ss-goals">
        <div className="ss-goals-header">
          <div className="ss-goals-title">
            <div className="ss-goals-icon" aria-hidden="true">
              🎯
            </div>

            <div>
              <h3>Savings Goals</h3>

              <p>
                {goalsLoading
                  ? "Loading your goals..."
                  : goals.length === 0
                    ? "Plan your next milestone"
                    : `${goals.length} goal${
                        goals.length === 1 ? "" : "s"
                      } · ${money(
                        goals.reduce(
                          (total, goal) =>
                            total + (Number(goal.saved) || 0),
                          0
                        )
                      )} saved`}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="ss-manage-button"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((value) => !value)}
          >
            {isExpanded ? "Close ▲" : "Manage Goals ＋"}
          </button>
        </div>

        {isExpanded && (
          <div className="ss-goals-content">
            {goalsError && (
              <p role="alert" className="ss-negative">
                {goalsError}
              </p>
            )}

            <div className="ss-goals-toolbar">
              <div>
                <h4>Your goals</h4>
                <p>Set a target and update it as you save.</p>
              </div>

              <button
                type="button"
                className="ss-add-goal-button"
                onClick={() =>
                  setShowGoalForm((value) => !value)
                }
              >
                {showGoalForm ? "Cancel" : "+ Add Goal"}
              </button>
            </div>

            {showGoalForm && (
              <form
                className="ss-goal-form"
                onSubmit={addGoal}
              >
                <input
                  type="text"
                  value={goalName}
                  onChange={(event) =>
                    setGoalName(event.target.value)
                  }
                  placeholder="Goal name (e.g. New laptop)"
                  maxLength={60}
                  required
                />

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={goalAmount}
                  onChange={(event) =>
                    setGoalAmount(event.target.value)
                  }
                  placeholder="Target amount (₹)"
                  required
                />

                <button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Goal"}
                </button>
              </form>
            )}

            {goalsLoading ? (
              <p>Loading savings goals...</p>
            ) : goals.length === 0 ? (
              <div className="ss-empty">
                <span aria-hidden="true">🏁</span>
                <p>
                  No goals yet. Add your first savings goal.
                </p>
              </div>
            ) : (
              <div className="ss-goal-list">
                {goals.map((goal) => {
                  const target = Number(goal.target) || 0;
                  const saved = Number(goal.saved) || 0;

                  const progress =
                    target > 0
                      ? Math.min(
                          100,
                          Math.round((saved / target) * 100)
                        )
                      : 0;

                  return (
                    <article
                      className="ss-goal-card"
                      key={goal._id}
                    >
                      <div className="ss-goal-top">
                        <div className="ss-goal-name">
                          <h4>{goal.name}</h4>

                          <p>
                            {money(saved)}{" "}
                            <span>of {money(target)}</span>
                          </p>
                        </div>

                        <button
                          type="button"
                          className="ss-delete-button"
                          onClick={() => deleteGoal(goal._id)}
                          aria-label={`Delete ${goal.name}`}
                          title="Delete goal"
                        >
                          ✕
                        </button>
                      </div>

                      <div
                        className="ss-progress-track"
                        role="progressbar"
                        aria-label={`${goal.name} progress`}
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="ss-progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="ss-progress-caption">
                        <span>{progress}% completed</span>

                        <span>
                          {money(Math.max(0, target - saved))} left
                        </span>
                      </div>

                      {progress < 100 ? (
                        <form
                          className="ss-add-savings-form"
                          onSubmit={(event) =>
                            addSavings(event, goal)
                          }
                        >
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={savedAmount[goal._id] || ""}
                            onChange={(event) =>
                              setSavedAmount((current) => ({
                                ...current,
                                [goal._id]: event.target.value,
                              }))
                            }
                            placeholder="Amount saved (₹)"
                            aria-label={`Amount saved for ${goal.name}`}
                            required
                          />

                          <button
                            type="submit"
                            disabled={submitting}
                          >
                            {submitting
                              ? "Updating..."
                              : "Update Savings"}
                          </button>
                        </form>
                      ) : (
                        <p className="ss-complete">
                          🎉 Congratulations! Goal completed.
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </section>
  );
}